# server/app/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import models  # ensures metadata is registered before create_all
from .routers import posts, auth  
from .routers import stats as stats_router
from .routers import culture as culture_router
from .routers import kopis as kopis_router
from .routers import uploads as uploads_router
from .routers import agency_trips as agency_trips_router
from .routers import places as places_router
from fastapi.staticfiles import StaticFiles
from .routers import trips as trips_router
import os

# Ensure tables exist (idempotent). For prod consider migrations, but this
# keeps new envs from booting without tables.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Read&Lead API")

# CORS 구성: 환경변수만으로 제어 (하드코딩 기본값 제거)
# - ALLOWED_ORIGINS: 콤마로 구분된 오리진 목록 (예: "https://web.example.com,http://localhost:3000")
# - ALLOWED_ORIGIN_REGEX: 정규식(선택) — 특정 패턴 도메인 허용 시 사용
# - ALLOW_ALL_ORIGINS: "1"/"true"/"yes" → 모든 오리진 허용(자격증명 비허용)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
allowed_origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX", "").strip()
allow_all = os.getenv("ALLOW_ALL_ORIGINS", "").strip().lower() in {"1", "true", "yes", "on"}

allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] if allowed_origins_env else []

cors_kwargs = dict(
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if allow_all:
    # 와일드카드 사용 시 브라우저 정책상 credentials 를 허용할 수 없음
    cors_kwargs.update(allow_origins=["*"], allow_credentials=False)
elif allowed_origin_regex:
    cors_kwargs.update(allow_origin_regex=allowed_origin_regex, allow_origins=[])
else:
    # 명시된 오리진만 허용. 미설정 시 교차 출처는 모두 차단(동일 출처는 CORS 비대상)
    cors_kwargs.update(allow_origins=allowed_origins)

app.add_middleware(CORSMiddleware, **cors_kwargs)

# Simple request logger to diagnose method/path issues during auth
@app.middleware("http")
async def _log_some_requests(request, call_next):
    try:
        p = request.url.path
        if p.startswith("/api/auth"):
            print(f"[AUTH] {request.method} {p}")
    except Exception:
        pass
    return await call_next(request)

# ✅ 이웃 글
app.include_router(posts.router, prefix="/api/neighbor-posts", tags=["neighbor-posts"])
# ✅ 로그인/회원가입
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(stats_router.router, prefix="/api", tags=["stats"])  # /api/users/count
app.include_router(culture_router.router, prefix="/api/culture", tags=["culture"])  # /api/culture/nearby
app.include_router(kopis_router.router, prefix="/api/kopis", tags=["kopis"])  # /api/kopis/perform
app.include_router(uploads_router.router, prefix="/api", tags=["uploads"])  # /api/uploads
app.include_router(agency_trips_router.router, prefix="/api/agency-trips", tags=["agency-trips"])  # /api/agency-trips/list

# static mount for uploaded files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/api/ping")
def ping():
    return {"ok": True}

app.include_router(trips_router.router, prefix="/api/trips", tags=["trips"])
app.include_router(places_router.router, prefix="/api", tags=["places"])  # /api/places/upsert

# Root 안내: 기본 URL 접속 시 간단 안내를 반환
@app.get("/")
def root_index():
    return {
        "ok": True,
        "service": "Read&Lead API",
        "docs": "/docs",
        "ping": "/api/ping",
    }
