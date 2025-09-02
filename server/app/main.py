# server/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import posts, auth   # ✅ auth 추가

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

@app.get("/api/ping")
def ping():
    return {"ok": True}
