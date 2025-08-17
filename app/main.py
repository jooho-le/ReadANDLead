from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from starlette.middleware.sessions import SessionMiddleware
import os
from .routes import books
from app.routes import culture, kopis, library
from .routes import auth


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


#  세션 미들웨어 추가 (Authlib가 request.session 사용)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev_session_secret"),
    same_site="lax",        # dev에 적합
    https_only=False,       # dev에서는 False; 배포 시 True 권장(HTTPS)
    max_age=60 * 60 * 4,    # (선택) 4시간
)

app.include_router(auth.router)

# 기존
app.include_router(books.router)

# 신규
app.include_router(culture.router, prefix="/culture", tags=["culture"])
app.include_router(kopis.router, prefix="/kopis", tags=["kopis"])
app.include_router(library.router, prefix="/library", tags=["library"])

