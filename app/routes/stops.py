# app/routes/stops.py
from typing import List, Optional, Dict
from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Query, Path
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["stops"])

# ---- 로컬 모델 (스키마 파일 없이 바로 사용) ----
class StopCreate(BaseModel):
    placeId: str
    date: Optional[date] = None          # 'YYYY-MM-DD'
    startTime: Optional[str] = None      # 'HH:MM'

class TripStopOut(BaseModel):
    id: str
    tripId: str
    placeId: str
    placeName: str = ""                  # 아직 place 조회 안 붙였으니 빈 문자열
    date: Optional[date] = None
    startTime: Optional[str] = None

# ---- 데모용 인메모리 저장소 (uvicorn 재시작되면 날아감) ----
_DB: Dict[str, List[TripStopOut]] = {}   # key = tripId

@router.get("/trips/{trip_id}/stops", response_model=List[TripStopOut])
def list_stops(
    trip_id: str = Path(...),
    date_filter: Optional[date] = Query(None, alias="date"),
):
    rows = _DB.get(trip_id, [])
    if date_filter:
        rows = [s for s in rows if s.date == date_filter]
    # 시간 오름차순 정렬
    rows = sorted(rows, key=lambda s: (s.date or date.min, s.startTime or ""))
    return rows

@router.post("/trips/{trip_id}/stops", response_model=TripStopOut)
def add_stop(trip_id: str, payload: StopCreate):
    item = TripStopOut(
        id=str(uuid4()),
        tripId=trip_id,
        placeId=payload.placeId,
        date=payload.date,
        startTime=payload.startTime,
        # placeName은 추후 place 테이블에서 조인해 채우자
        placeName="",
    )
    _DB.setdefault(trip_id, []).append(item)
    return item
