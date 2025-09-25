"""Authentication endpoints using SQLAlchemy models and JWT tokens."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, security
from ..database import get_db
from ..deps import get_current_user_required

router = APIRouter()


@router.post("/register", response_model=schemas.TokenOut)
def register(payload: schemas.RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    display_name = payload.display_name or email.split("@")[0]
    hashed_password = security.hash_password(payload.password)

    user = models.User(
        email=email,
        hashed_password=hashed_password,
        display_name=display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_access_token(str(user.id))
    return schemas.TokenOut(access_token=token)


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not security.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = security.create_access_token(str(user.id))
    return schemas.TokenOut(access_token=token)


@router.get("/me", response_model=schemas.UserMe)
def me(current_user: models.User = Depends(get_current_user_required)):
    return schemas.UserMe(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
    )
