"""Statistics endpoints backed by SQLAlchemy."""
from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db

router = APIRouter()


# simple in-process cache
_users_count_cache: dict[str, int] = {}
_users_count_ts: float | None = None
_USERS_COUNT_TTL = 60.0  # seconds


@router.get("/users/count")
def users_count(request: Request, response: Response, db: Session = Depends(get_db)):
    import time
    global _users_count_ts
    now = time.time()

    if _users_count_ts and (now - _users_count_ts) < _USERS_COUNT_TTL:
        v = _users_count_cache.get("v") or 0
        etag = f'W/"users-{v}"'
        inm = request.headers.get("if-none-match")
        if inm == etag:
            return Response(status_code=304)
        response.headers["ETag"] = etag
        response.headers["Cache-Control"] = f"public, max-age={int(_USERS_COUNT_TTL)}"
        return {"count": int(v)}

    total = db.execute(select(func.count(models.User.id))).scalar_one()
    _users_count_cache["v"] = int(total)
    _users_count_ts = now
    etag = f'W/"users-{int(total)}"'
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = f"public, max-age={int(_USERS_COUNT_TTL)}"
    return {"count": int(total)}
