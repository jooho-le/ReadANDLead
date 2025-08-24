from fastapi import APIRouter, Query
from typing import Optional
from ..services.library_api import get_librarian_picks
from datetime import datetime

router = APIRouter()

@router.get("/recommendations")
def library_recommendations(
    start_date: str = Query(..., description="YYYYMMDD"),
    end_date: str = Query(..., description="YYYYMMDD"),
    dr_code: int = Query(11, ge=1, le=99),
    start: int = Query(1, ge=1),
    end: int = Query(20, ge=1, le=200)
):
    return get_librarian_picks(start_date, end_date, dr_code, start, end)
