"""Statistics endpoints backed by SQLAlchemy."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db

router = APIRouter()


@router.get("/users/count")
def users_count(db: Session = Depends(get_db)):
    total = db.execute(select(func.count(models.User.id))).scalar_one()
    return {"count": int(total)}
