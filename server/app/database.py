import os
from typing import Final

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _str_to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "t", "yes", "y"}


def _get_default_sqlite_url() -> str:
    sqlite_path = os.getenv("SQLITE_PATH", "./db.sqlite3")
    if not sqlite_path.startswith("sqlite:"):
        sqlite_path = f"sqlite:///{sqlite_path}"
    return sqlite_path


def _get_database_url() -> str:
    """Pick the database URL, guarding against accidental prod resets."""
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    allow_fallback = _str_to_bool(os.getenv("ALLOW_SQLITE_FALLBACK"), default=True)
    if not allow_fallback:
        raise RuntimeError(
            "DATABASE_URL is not set and ALLOW_SQLITE_FALLBACK is false. "
            "Configure a persistent database before starting the server."
        )
    return _get_default_sqlite_url()


DATABASE_URL: Final[str] = _get_database_url()

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

try:
    scheme = DATABASE_URL.split(":", 1)[0]
    print(f"[DB] Using {scheme} database")
except Exception:
    pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
