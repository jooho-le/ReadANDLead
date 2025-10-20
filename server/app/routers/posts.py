"""Neighbor posts endpoints backed by SQLAlchemy models."""
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session, joinedload, load_only

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user_required

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
