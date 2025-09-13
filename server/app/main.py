# server/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import posts, auth   # ✅ auth 추가
from .routers import stats as stats_router
from .routers import culture as culture_router
from .routers import kopis as kopis_router
from .routers import uploads as uploads_router
from .routers import agency_trips as agency_trips_router
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Read&Lead API")

# CORS origins: from env FRONTEND_ORIGINS (comma-separated) + sensible dev defaults
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_env_origins = os.getenv("FRONTEND_ORIGINS", "")
allow_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] or _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
