"""Copy local SQLite data into a persistent database.

Usage:
    python scripts/migrate_sqlite_to_postgres.py --dest postgresql://...

You can override the source database with --src (defaults to the project SQLite file).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Iterable

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


ROOT = Path(__file__).resolve().parents[1]
SERVER_ROOT = ROOT / "server"
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

from app import models  # type: ignore  # noqa: E402
from app.database import Base  # type: ignore  # noqa: E402


def default_sqlite_url() -> str:
    candidate = ROOT / "server" / "app" / "db.sqlite3"
    if candidate.exists():
        return f"sqlite:///{candidate}"
    return os.getenv("SQLITE_PATH", "sqlite:///./db.sqlite3")


def build_session(engine: Engine) -> Session:
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return factory()


def copy_rows(model, source: Session, dest: Session) -> int:
    rows: Iterable = source.query(model).all()
    copied = 0
    for row in rows:
        data = {column.name: getattr(row, column.name) for column in model.__table__.columns}
        dest.merge(model(**data))
        copied += 1
    dest.commit()
    return copied


def bump_sequences(engine: Engine, tables: Iterable[str]) -> None:
    if not engine.url.drivername.startswith("postgres"):
        return
    with engine.begin() as conn:
        for table in tables:
            stmt = text(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 0) + 1, false)"
            )
            conn.execute(stmt)


def main() -> None:
    parser = argparse.ArgumentParser(description="Copy data from SQLite into another database")
    parser.add_argument("--src", default=os.getenv("SOURCE_DATABASE_URL", default_sqlite_url()))
    parser.add_argument("--dest", required=True, help="Destination DATABASE_URL (e.g. postgres://)")
    args = parser.parse_args()

    src_engine = create_engine(args.src, connect_args={"check_same_thread": False} if args.src.startswith("sqlite") else {})
    dest_engine = create_engine(args.dest)

    Base.metadata.create_all(bind=dest_engine)

    src_session = build_session(src_engine)
    dest_session = build_session(dest_engine)

    try:
        user_count = copy_rows(models.User, src_session, dest_session)
        post_count = copy_rows(models.NeighborPost, src_session, dest_session)
    finally:
        src_session.close()
        dest_session.close()

    bump_sequences(dest_engine, ["users", "neighbor_posts"])

    print(f"Copied {user_count} users and {post_count} neighbor posts to {args.dest}")


if __name__ == "__main__":
    main()
