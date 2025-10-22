"""Neighbor posts endpoints backed by SQLAlchemy models."""
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session, joinedload, load_only

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user_required

from fastapi import Body

from datetime import datetime, timezone, timedelta
KST = timezone(timedelta(hours=9))

router = APIRouter()

# in-process cache for summaries (by limit)
_summary_cache: dict[int, list[schemas.PostSummary]] = {}
_summary_ts: dict[int, float] = {}
_SUMMARY_TTL = 30.0  # seconds


def _serialize_images(value: str | None) -> List[str] | None:
    if not value:
        return None
    try:
        data = json.loads(value)
        return data if isinstance(data, list) else None
    except json.JSONDecodeError:
        return None


def _post_to_schema(post: models.NeighborPost) -> schemas.PostOut:
    author_name = post.author.display_name if post.author else "익명"
    return schemas.PostOut(
        id=post.id,
        author=author_name,
        title=post.title,
        cover=post.cover,
        images=_serialize_images(post.images),
        content_html=post.content_html,
        date=post.created_at,
    )


def _post_to_summary(post: models.NeighborPost) -> schemas.PostSummary:
    author_name = post.author.display_name if post.author else "익명"
    return schemas.PostSummary(
        id=post.id,
        author=author_name,
        title=post.title,
        cover=post.cover,
        date=post.created_at,
    )


@router.get("", response_model=List[schemas.PostOut])
def list_posts(db: Session = Depends(get_db)):
    posts = (
        db.query(models.NeighborPost)
        .order_by(models.NeighborPost.created_at.desc())
        .all()
    )
    return [_post_to_schema(post) for post in posts]


@router.get("/summary", response_model=List[schemas.PostSummary])
def list_posts_summary(limit: int = 30, request: Request = None, response: Response = None, db: Session = Depends(get_db)):
    safe_limit = max(1, min(limit, 100))
    import time
    now = time.time()
    ts = _summary_ts.get(safe_limit)
    if ts and (now - ts) < _SUMMARY_TTL:
        rows = _summary_cache.get(safe_limit, [])
        # ETag composed from limit + ts + rows length
        etag = f'W/"sum-{safe_limit}-{int(ts)}-{len(rows)}"'
        if request is not None and request.headers.get("if-none-match") == etag:
            return Response(status_code=304)
        if response is not None:
            response.headers["ETag"] = etag
            response.headers["Cache-Control"] = f"public, max-age={int(_SUMMARY_TTL)}"
        return rows
    posts = (
        db.query(models.NeighborPost)
        .options(
            load_only(
                models.NeighborPost.id,
                models.NeighborPost.title,
                models.NeighborPost.cover,
                models.NeighborPost.created_at,
            ),
            joinedload(models.NeighborPost.author).load_only(models.User.display_name),
        )
        .order_by(models.NeighborPost.created_at.desc())
        .limit(safe_limit)
        .all()
    )
    rows = [_post_to_summary(post) for post in posts]
    _summary_cache[safe_limit] = rows
    _summary_ts[safe_limit] = now
    if response is not None:
        etag = f'W/"sum-{safe_limit}-{int(now)}-{len(rows)}"'
        response.headers["ETag"] = etag
        response.headers["Cache-Control"] = f"public, max-age={int(_SUMMARY_TTL)}"
    return rows


@router.get("/{post_id}", response_model=schemas.PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.get(models.NeighborPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return _post_to_schema(post)


@router.post("", response_model=schemas.PostOut)
def create_post(
    payload: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_required),
):
    post = models.NeighborPost(
        user_id=current_user.id,
        title=payload.title,
        cover=payload.cover,
        content_html=payload.content_html,
        images=json.dumps(payload.images) if payload.images else None,
        created_at=datetime.now(KST),   # 한국 시간으로 저장
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_to_schema(post)


@router.put("/{post_id}", response_model=schemas.PostOut)
def update_post(
    post_id: int,
    payload: schemas.PostUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_required),
):
    post = db.get(models.NeighborPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if payload.title is not None:
        post.title = payload.title
    if payload.cover is not None:
        post.cover = payload.cover
    if payload.content_html is not None:
        post.content_html = payload.content_html
    if payload.images is not None:
        post.images = json.dumps(payload.images)

    db.commit()
    db.refresh(post)
    return _post_to_schema(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_required),
):
    post = db.get(models.NeighborPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    db.delete(post)
    db.commit()
    return

@router.post("/{post_id}/claim", status_code=status.HTTP_204_NO_CONTENT)
def claim_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_required),
):
    """
    소유권 등록(Claim) 기능
    - 레거시 글 등에서 작성자 정보가 없거나 다를 때, 현재 로그인 사용자가 소유권을 등록.
    - 프론트에서는 삭제 시도 실패 시 자동으로 이 API를 호출함.
    """
    post = db.get(models.NeighborPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # 이미 본인 글이면 아무 작업 없이 성공 처리
    if post.user_id == current_user.id:
        return

    # 작성자 이름이 같으면 소유권 이전 허용 (필요시 조건 수정 가능)
    if post.author and post.author.display_name == current_user.display_name:
        post.user_id = current_user.id
        db.add(post)
        db.commit()
        return

    # 조건이 맞지 않으면 권한 거부
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.get("/{post_id}/comments", response_model=List[schemas.CommentOut])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    """특정 게시글의 댓글 목록 조회"""
    post = db.get(models.NeighborPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = (
        db.query(models.NeighborComment)
        .filter(models.NeighborComment.post_id == post_id)
        .order_by(models.NeighborComment.created_at.asc())
        .all()
    )
    return [
        schemas.CommentOut(
            id=c.id,
            post_id=c.post_id,
            author=c.author.display_name if c.author else "익명",
            content=c.content,
            date=c.created_at,
        )
        for c in comments
    ]

@router.post("/{post_id}/comments", response_model=schemas.CommentOut)
def create_comment(
    post_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_required),
):
    """댓글 작성"""
    post = db.get(models.NeighborPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    content = payload.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Content required")

    comment = models.NeighborComment(
        post_id=post_id,
        user_id=current_user.id,
        content=content,
        created_at=datetime.now(KST),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return schemas.CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        author=current_user.display_name,
        content=comment.content,
        date=comment.created_at,
    )


@router.delete("/{post_id}/comments/{comment_id}", status_code=204)
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_required),
):
    """댓글 삭제"""
    comment = db.get(models.NeighborComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(comment)
    db.commit()
    return