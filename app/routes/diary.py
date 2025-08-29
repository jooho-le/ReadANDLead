from fastapi import APIRouter, Depends, Query
from typing import List
from uuid import uuid4
from datetime import datetime, timezone
from app.schemas.diary import DiaryEntryCreate, DiaryEntryOut

router = APIRouter(prefix="/api", tags=["diary"])

# 간단 스텁 저장소(서버 재시작 시 초기화)
_STORE: dict[str, list[dict]] = {}

def get_current_user():
    class U: id = "demo-user"  # 실제 인증 붙이면 교체
    return U()

@router.get("/trips/{trip_id}/diary", response_model=List[DiaryEntryOut])
def list_diary(trip_id: str, limit: int = Query(50, le=100)):
    return (_STORE.get(trip_id, []))[:limit]

@router.post("/trips/{trip_id}/diary", response_model=DiaryEntryOut)
def create_diary(trip_id: str, payload: DiaryEntryCreate, user = Depends(get_current_user)):
    item = {
        "id": str(uuid4()),
        "trip_id": trip_id,
        "stop_id": payload.stop_id,
        "author_id": user.id,
        "entry_type": payload.entry_type,
        "text": payload.text,
        "content": payload.content or {},
        "happened_at": payload.happened_at,
        "created_at": datetime.now(timezone.utc),
    }
    _STORE.setdefault(trip_id, []).insert(0, item)
    return item
