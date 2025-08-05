from fastapi import APIRouter, Query
from services.tour_api import search_tourapi_by_keyword
import json
import os
from pathlib import Path

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent.parent
EVENT_PATH = BASE_DIR / "data" / "book_location_event.json"

@router.get("/search_book")
def search_book(book_title: str = Query(...)):
    if not EVENT_PATH.exists():
        return {"error": "book_location_event.json 파일이 없습니다."}

    with open(EVENT_PATH, "r", encoding="utf-8") as f:
        event_data = json.load(f)

    print("📚 JSON keys:", list(event_data.keys()))
    print("🔍 사용자 입력:", book_title)

    # 유사 키 비교 (공백 제거 + 소문자 처리)
    book_key = next(
        (key for key in event_data if key.strip().lower() == book_title.strip().lower()),
        None
    )

    if not book_key:
        return {
            "book": book_title,
            "location": None,
            "tour": "❌ 관련 장소 없음"
        }

    location_info = event_data[book_key][0]
    location_name = location_info["location"]
    event_description = location_info["event"]

    # 지도 좌표용 처리 (선택 사항)
    # 나중에 위도경도 추가해도 여기서 처리 가능

    # TourAPI로 관광지 검색
    tour_result = search_tourapi_by_keyword(location_name)

    return {
        "book": book_key,
        "location": location_name,
        "event": event_description,
        "tour_sites": tour_result.get("response", {}).get("body", {}).get("items", {}).get("item", []),
    }
