import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _get_database_url() -> str:
    """Fetch DATABASE_URL from env, fallback to local SQLite."""
    return os.getenv("DATABASE_URL", "sqlite:///./app.db")


DATABASE_URL = _get_database_url()

# SQLite needs the check_same_thread option, other engines (e.g. Postgres) do not.
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
