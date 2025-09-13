# server/app/routers/posts.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db.sqlite3")
DB_PATH = os.path.abspath(DB_PATH)

router = APIRouter()

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS neighbor_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            cover TEXT,
            images TEXT,          -- JSON 문자열
            content_html TEXT NOT NULL,
            user_id INTEGER
        )
    """)
    # 마이그레이션: user_id 컬럼 없을 수 있음
    try:
        conn.execute("ALTER TABLE neighbor_posts ADD COLUMN user_id INTEGER")
        conn.commit()
    except Exception:
        pass

    # 댓글 테이블
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS neighbor_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY(post_id) REFERENCES neighbor_posts(id) ON DELETE CASCADE
        )
        """
    )
    return conn

class PostOut(BaseModel):
    id: int
    author: str
    title: str
    date: str
    cover: Optional[str] = None
    images: Optional[List[str]] = None
    content_html: str

class PostIn(BaseModel):
    title: str
    cover: Optional[str] = None
    content_html: str
    images: Optional[List[str]] = None
    author: Optional[str] = None  # 임시(인증 붙이기 전). 없으면 '익명'으로.

def row_to_post(r: sqlite3.Row) -> PostOut:
    imgs = json.loads(r["images"]) if r["images"] else None
    return PostOut(
        id=r["id"],
        author=r["author"],
        title=r["title"],
        date=r["date"],
        cover=r["cover"],
        images=imgs,
        content_html=r["content_html"],
    )

@router.get("", response_model=List[PostOut])
def list_posts():
    conn = get_conn()
    cur = conn.execute(
        "SELECT * FROM neighbor_posts ORDER BY id DESC"
    )
    rows = cur.fetchall()
    conn.close()
    return [row_to_post(r) for r in rows]

@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int):
    conn = get_conn()
    cur = conn.execute("SELECT * FROM neighbor_posts WHERE id = ?", (post_id,))
    r = cur.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="Post not found")
    return row_to_post(r)

def _get_user_by_token(token: str):
    conn = get_conn()
    cur = conn.execute(
        """
        SELECT u.id, u.email, u.display_name
          FROM sessions s
          JOIN users u ON u.id = s.user_id
         WHERE s.token = ?
        """,
        (token,),
    )
    row = cur.fetchone()
    conn.close()
    return row

@router.post("", response_model=PostOut)
def create_post(p: PostIn, authorization: Optional[str] = Header(None)):
    conn = get_conn()
    now = datetime.utcnow().isoformat()
    author = p.author or "익명"
    user_id: Optional[int] = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        u = _get_user_by_token(token)
        if u:
            user_id = u["id"]
            author = u["display_name"] or u["email"]
    images_json = json.dumps(p.images) if p.images else None
    cur = conn.execute(
        """
        INSERT INTO neighbor_posts (author, title, date, cover, images, content_html)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (author, p.title, now, p.cover, images_json, p.content_html),
    )
    # user_id 업데이트(INSERT에서 컬럼 없던 데이터 대비)
    if user_id is not None:
        conn.execute("UPDATE neighbor_posts SET user_id = ? WHERE id = ?", (user_id, cur.lastrowid))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return get_post(new_id)

@router.put("/{post_id}", response_model=PostOut)
def update_post(post_id: int, p: PostIn):
    # 부분 업데이트를 간단화하려고 PostIn을 그대로 받되, 전달값만 반영
    conn = get_conn()
    cur = conn.execute("SELECT * FROM neighbor_posts WHERE id = ?", (post_id,))
    r = cur.fetchone()
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")

    author = p.author or r["author"]
    title = p.title or r["title"]
    cover = p.cover if p.cover is not None else r["cover"]
    content_html = p.content_html or r["content_html"]
    images_json = json.dumps(p.images) if p.images is not None else r["images"]

    conn.execute(
        """
        UPDATE neighbor_posts
           SET author = ?, title = ?, cover = ?, images = ?, content_html = ?
         WHERE id = ?
        """,
        (author, title, cover, images_json, content_html, post_id),
    )
    conn.commit()
    conn.close()
    return get_post(post_id)

@router.delete("/{post_id}")
def delete_post(post_id: int, authorization: Optional[str] = Header(None)):
    conn = get_conn()
    # 삭제 권한 체크
    cur = conn.execute("SELECT id, author, user_id FROM neighbor_posts WHERE id = ?", (post_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")

    if not authorization or not authorization.lower().startswith("bearer "):
        conn.close()
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    u = _get_user_by_token(token)
    if not u:
        conn.close()
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 본인 글만 삭제 가능
    if row["user_id"] is not None:
        if int(row["user_id"]) != int(u["id"]):
            conn.close()
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        # user_id 없던 기존 데이터: author 문자열로 비교(느슨)
        disp = u["display_name"] or u["email"]
        if (row["author"] or "") != disp:
            conn.close()
            raise HTTPException(status_code=403, detail="Forbidden")

    conn.execute("DELETE FROM neighbor_posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@router.post("/{post_id}/claim")
def claim_post(post_id: int, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    u = _get_user_by_token(token)
    if not u:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_conn()
    cur = conn.execute("SELECT id, user_id FROM neighbor_posts WHERE id = ?", (post_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    # 이미 소유자 있으면 금지
    if row["user_id"] is not None:
        conn.close()
        raise HTTPException(status_code=409, detail="Already owned")

    author = u["display_name"] or u["email"]
    conn.execute("UPDATE neighbor_posts SET user_id = ?, author = ? WHERE id = ?", (int(u["id"]), author, post_id))
    conn.commit()
    conn.close()
    return {"ok": True}

# ===== 댓글 API =====
class CommentOut(BaseModel):
    id: int
    post_id: int
    author: str
    content: str
    date: str

@router.get("/{post_id}/comments", response_model=List[CommentOut])
def list_comments(post_id: int):
    conn = get_conn()
    cur = conn.execute(
        "SELECT id, post_id, author, content, date FROM neighbor_comments WHERE post_id = ? ORDER BY id ASC",
        (post_id,),
    )
    rows = [
        CommentOut(id=r["id"], post_id=post_id, author=r["author"], content=r["content"], date=r["date"]) for r in cur.fetchall()
    ]
    conn.close()
    return rows

class CommentIn(BaseModel):
    content: str

@router.post("/{post_id}/comments", response_model=CommentOut)
def add_comment(post_id: int, c: CommentIn, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    u = _get_user_by_token(token)
    if not u:
        raise HTTPException(status_code=401, detail="Unauthorized")

    author = u["display_name"] or u["email"]
    now = datetime.utcnow().isoformat()
    conn = get_conn()
    conn.execute(
        "INSERT INTO neighbor_comments (post_id, user_id, author, content, date) VALUES (?, ?, ?, ?, ?)",
        (post_id, int(u["id"]), author, c.content, now),
    )
    conn.commit()
    cur = conn.execute("SELECT last_insert_rowid() AS id")
    cid = cur.fetchone()["id"]
    conn.close()
    return CommentOut(id=cid, post_id=post_id, author=author, content=c.content, date=now)

@router.delete("/{post_id}/comments/{comment_id}")
def delete_comment(post_id: int, comment_id: int, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    u = _get_user_by_token(token)
    if not u:
        raise HTTPException(status_code=401, detail="Unauthorized")
    conn = get_conn()
    cur = conn.execute("SELECT user_id FROM neighbor_comments WHERE id = ? AND post_id = ?", (comment_id, post_id))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Comment not found")
    if row["user_id"] is not None and int(row["user_id"]) != int(u["id"]):
        conn.close()
        raise HTTPException(status_code=403, detail="Forbidden")
    conn.execute("DELETE FROM neighbor_comments WHERE id = ?", (comment_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
