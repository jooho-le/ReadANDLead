from fastapi import APIRouter
from typing import List
import os

router = APIRouter()


@router.get("/diag", response_model=None)
def diag():
    # This route will be mounted with prefix /api/debug
    # Collect route paths from the global app via dependency injection fallback
    try:
        from fastapi import FastAPI
        from fastapi.dependencies.utils import get_flat_dependant  # noqa: F401
    except Exception:
        pass

    # Expose simple booleans to quickly validate deployment
    tour_key = bool(os.getenv("TOURAPI_KEY") or "")
    allow_all = (os.getenv("ALLOW_ALL_ORIGINS", "").strip().lower() in {"1","true","yes","on"})
    allowed = (os.getenv("ALLOWED_ORIGINS", "").strip())

    # Route presence check by importing app instance
    paths: List[str] = []
    try:
        from ..main import app  # type: ignore
        paths = sorted([r.path for r in app.routes if hasattr(r, "path")])
    except Exception:
        pass

    def has(p: str) -> bool:
        return any(s == p for s in paths)

    return {
        "ok": True,
        "tourapi_key_set": tour_key,
        "allow_all_origins": allow_all,
        "allowed_origins_set": bool(allowed),
        "routes": {
            "neighbor_mine": has("/api/neighbor-posts/mine"),
            "tour_search": has("/api/tour/search"),
            "trips_summary": has("/api/trips/summary"),
        },
    }
