from fastapi import APIRouter
import sqlite3
import os

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db.sqlite3")
DB_PATH = os.path.abspath(DB_PATH)

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # users 테이블이 없는 경우 대비 (auth 라우터와 동일 스키마)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    return conn

@router.get("/users/count")
def users_count():
    conn = get_conn()
    cur = conn.execute("SELECT COUNT(*) AS n FROM users")
    n = cur.fetchone()["n"]
    conn.close()
    return {"count": int(n)}

