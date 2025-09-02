# server/app/routers/posts.py
from fastapi import APIRouter, HTTPException
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
            content_html TEXT NOT NULL
        )
    """)
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

@router.post("", response_model=PostOut)
def create_post(p: PostIn):
    conn = get_conn()
    now = datetime.utcnow().isoformat()
    author = p.author or "익명"
    images_json = json.dumps(p.images) if p.images else None
    cur = conn.execute(
        """
        INSERT INTO neighbor_posts (author, title, date, cover, images, content_html)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (author, p.title, now, p.cover, images_json, p.content_html),
    )
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
def delete_post(post_id: int):
    conn = get_conn()
    cur = conn.execute("DELETE FROM neighbor_posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}
