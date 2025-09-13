from fastapi import APIRouter, Query
from typing import Optional
from ..services.culture_api import search_events_nearby
from datetime import datetime, timedelta

router = APIRouter()

def _today():
    return datetime.now().strftime("%Y%m%d")

@router.get("/nearby")
def culture_nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(5.0, ge=0.5, le=50.0),
    date_from: Optional[str] = Query(None, description="YYYYMMDD"),
    date_to: Optional[str] = Query(None, description="YYYYMMDD"),
    keyword: str = Query("", description="optional keyword filter")
):
    if not date_from:
        date_from = _today()
    if not date_to:
        date_to = (datetime.now() + timedelta(days=14)).strftime("%Y%m%d")

    result = search_events_nearby(lat, lng, radius_km, date_from, date_to, keyword=keyword)
    return result
