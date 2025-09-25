# server/app/deps.py
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import models, security
from .database import get_db

bearer_scheme = HTTPBearer(auto_error=False)  # Authorization 헤더가 없어도 에러 안 내고 None 반환


def _decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user_optional(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """
    인증이 있어도 되고 없어도 되는 의존성.
    - 토큰이 없거나 토큰이 잘못돼도 None 반환
    - 토큰이 정상이면 DB에서 유저 로드하여 반환
    """
    if not creds:
        return None

    payload = _decode_access_token(creds.credentials)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    # SQLAlchemy 1.4/2.x 호환: get(primary_key)
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return None

    return db.get(models.User, user_id_int)


async def get_current_user_required(
    user: Optional[models.User] = Depends(get_current_user_optional),
) -> models.User:
    """
    인증이 반드시 필요한 의존성.
    - 위 optional 결과가 None이면 401
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user
