# server/app/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import posts, auth  
from .routers import stats as stats_router
from .routers import culture as culture_router
from .routers import kopis as kopis_router
from .routers import uploads as uploads_router
from fastapi.staticfiles import StaticFiles
from .routers import trips as trips_router
import os

print("OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="Read&Lead API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

# static mount for uploaded files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/api/ping")
def ping():
    return {"ok": True}

app.include_router(trips_router.router, prefix="/api/trips", tags=["trips"])

