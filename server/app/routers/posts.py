"""Neighbor posts endpoints backed by SQLAlchemy models."""
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user_required

router = APIRouter()


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


@router.get("", response_model=List[schemas.PostOut])
def list_posts(db: Session = Depends(get_db)):
    posts = (
        db.query(models.NeighborPost)
        .order_by(models.NeighborPost.created_at.desc())
        .all()
    )
    return [_post_to_schema(post) for post in posts]


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
