from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from starlette.middleware.sessions import SessionMiddleware
import os
from .routes import books
from app.routes import culture, kopis, library
from app.routes.diary import router as diary_router
from .routes import auth
from uuid import uuid4


app = FastAPI()

origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#  세션 미들웨어 추가 (Authlib가 request.session 사용)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev_session_secret"),
    same_site="lax",        # dev에 적합
    https_only=False,       # dev에서는 False; 배포 시 True 권장(HTTPS)
    max_age=60 * 60 * 4,    # (선택) 4시간
)

app.include_router(auth.router)

# 기존
app.include_router(books.router)

# 신규
app.include_router(culture.router, prefix="/culture", tags=["culture"])
app.include_router(kopis.router, prefix="/kopis", tags=["kopis"])
app.include_router(library.router, prefix="/library", tags=["library"])
app.include_router(diary_router)

TRIPS: List[Dict] = []
PLACES: Dict[str, Dict] = {}

class TripIn(BaseModel):
    title: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class Trip(TripIn):
    id: str

class UpsertPlaceIn(BaseModel):
    source: str
    externalId: str
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None

class AddStopIn(BaseModel):
    placeId: str
    date: Optional[str] = None
    startTime: Optional[str] = None

@app.get("/api/trips", response_model=List[Trip])
def list_trips(mine: Optional[int] = None):
    return TRIPS

@app.post("/api/trips", response_model=Trip)
def create_trip(data: TripIn):
    t = {"id": str(uuid4()), **data.dict()}
    TRIPS.insert(0, t)
    return t

@app.post("/api/places/upsert")
def upsert_place(p: UpsertPlaceIn):
    key = f"{p.source}:{p.externalId}"
    found = next((pid for pid, obj in PLACES.items() if obj.get("key") == key), None)
    pid = found or str(uuid4())
    PLACES[pid] = {"id": pid, "key": key, **p.dict()}
    return {"id": pid}

@app.post("/api/trips/{trip_id}/stops")
def add_stop(trip_id: str, payload: AddStopIn):
    if not any(t["id"] == trip_id for t in TRIPS):
        raise HTTPException(status_code=404, detail="trip not found")
    # 실제 저장 대신 OK만
    return {"ok": True}