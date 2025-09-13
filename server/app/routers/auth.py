# server/app/routers/auth.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os, json, uuid, hashlib, hmac
from datetime import datetime

router = APIRouter()

# --- DB 공통 (posts.py와 같은 폴더 기준으로 같은 DB 파일을 씁니다) ---
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db.sqlite3")
DB_PATH = os.path.abspath(DB_PATH)

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # users 테이블
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            created_at TEXT NOT NULL
        )
    """)
    # 세션(토큰) 테이블
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    return conn

# --- 비번 해시 (외부 라이브러리 없이 동작) ---
def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = uuid.uuid4().hex
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000)
    return f"{salt}${dk.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, hexhash = stored.split("$", 1)
    except ValueError:
        return False
    test = hash_password(password, salt).split("$", 1)[1]
    return hmac.compare_digest(test, hexhash)

def issue_token() -> str:
    return uuid.uuid4().hex

def get_user_by_token(token: str):
    conn = get_conn()
    cur = conn.execute("""
        SELECT u.id, u.email, u.display_name
          FROM sessions s
          JOIN users u ON u.id = s.user_id
         WHERE s.token = ?
    """, (token,))
    row = cur.fetchone()
    conn.close()
    return row

# --- 스키마 ---
class RegisterIn(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None
    class Config:
        extra = "allow"   # displayName 같은 추가 키 허용

class LoginIn(BaseModel):
    email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MeOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str] = None

# --- 라우트 ---
@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn):
    conn = get_conn()
    # displayName 지원 (프론트가 카멜로 보낼 수 있으니)
    dn = payload.display_name or getattr(payload, "displayName", None)
    if not dn:
        dn = payload.email.split("@")[0]

    # 중복 이메일 체크
    cur = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.utcnow().isoformat()
    pw = hash_password(payload.password)
    conn.execute(
        "INSERT INTO users (email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)",
        (payload.email, pw, dn, now)
    )
    conn.commit()
    # 토큰 발급
    cur = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email,))
    uid = cur.fetchone()["id"]
    token = issue_token()
    conn.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                 (token, uid, now))
    conn.commit()
    conn.close()
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn):
    conn = get_conn()
    cur = conn.execute("SELECT id, password_hash FROM users WHERE email = ?", (payload.email,))
    row = cur.fetchone()
    if not row or not verify_password(payload.password, row["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = row["id"]
    token = issue_token()
    now = datetime.utcnow().isoformat()
    conn.execute("INSERT OR REPLACE INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                 (token, uid, now))
    conn.commit()
    conn.close()
    return TokenOut(access_token=token)

@router.get("/me", response_model=MeOut)
def me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    row = get_user_by_token(token)
    if not row:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return MeOut(id=row["id"], email=row["email"], display_name=row["display_name"])
