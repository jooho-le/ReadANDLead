from fastapi import APIRouter, Query
from typing import Optional
from services.kopis_api import search_performances
from datetime import datetime, timedelta

router = APIRouter()

def _today():
    return datetime.now().strftime("%Y%m%d")

@router.get("/search")
def kopis_search(
    city: str = Query("", description="예: 광주광역시 / 서울특별시"),
    gugun_code: str = Query("", description="KOPIS 구군 코드(선택)"),
    date_from: Optional[str] = Query(None, description="YYYYMMDD"),
    date_to: Optional[str] = Query(None, description="YYYYMMDD"),
    rows: int = Query(30, ge=1, le=200),
    page: int = Query(1, ge=1)
):
    if not date_from:
        date_from = _today()
    if not date_to:
        date_to = (datetime.now() + timedelta(days=14)).strftime("%Y%m%d")

    data = search_performances(date_from, date_to, city=city, gugun_code=gugun_code, rows=rows, page=page)
    return data
