from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os, sqlite3, datetime

router = APIRouter()

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db.sqlite3"))


def _conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS places (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            external_id TEXT NOT NULL,
            name TEXT,
            address TEXT,
            lat REAL,
            lng REAL,
            created_at TEXT NOT NULL,
            UNIQUE(user_id, source, external_id)
        )
        """
    )
    return conn


def _utcnow():
    return datetime.datetime.utcnow().isoformat()


def _get_user_id_from_header() -> int:
    # Minimal user scoping. In a real app pull from auth/session.
    # Re-using simple approach from trips router.
    return 1


class UpsertPlaceIn(BaseModel):
    source: str
    externalId: str
    name: str
    lat: float | None = None
    lng: float | None = None
    address: str | None = None


@router.post("/places/upsert")
def upsert_place(payload: UpsertPlaceIn):
    user_id = _get_user_id_from_header()
    conn = _conn()
    now = _utcnow()
    cur = conn.execute(
        "SELECT id FROM places WHERE user_id=? AND source=? AND external_id=?",
        (user_id, payload.source, payload.externalId),
    ).fetchone()
    if cur:
        # Update basic fields on re-upsert
        conn.execute(
            "UPDATE places SET name=?, address=?, lat=?, lng=? WHERE id=?",
            (payload.name, payload.address, payload.lat, payload.lng, cur["id"]),
        )
        conn.commit()
        conn.close()
        return {"id": str(cur["id"]) }
    conn.execute(
        """
        INSERT INTO places(user_id, source, external_id, name, address, lat, lng, created_at)
        VALUES(?,?,?,?,?,?,?,?)
        """,
        (user_id, payload.source, payload.externalId, payload.name, payload.address, payload.lat, payload.lng, now),
    )
    rid = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
    conn.commit(); conn.close()
    return {"id": str(rid)}

