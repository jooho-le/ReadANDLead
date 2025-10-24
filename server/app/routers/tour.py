from fastapi import APIRouter, Query
from typing import Optional
import os
import httpx

router = APIRouter()

BASE_URL = "https://apis.data.go.kr/B551011/KorService1/searchKeyword1"


@router.get("/search")
async def tour_search(
    keyword: str = Query(..., description="검색 키워드(도시명/장소 키워드)"),
    numOfRows: int = Query(10, ge=1, le=50),
    pageNo: int = Query(1, ge=1),
):
    """Proxy to TourAPI (KorService1 searchKeyword1) using env TOURAPI_KEY."""
    service_key = os.getenv("TOURAPI_KEY")
    if not service_key:
        return {"error": "TOURAPI_KEY not set"}

    params = {
        "serviceKey": service_key,
        "MobileOS": "ETC",
        "MobileApp": "readandlead",
        "numOfRows": numOfRows,
        "pageNo": pageNo,
        "keyword": keyword,
        "_type": "json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(BASE_URL, params=params)
        r.raise_for_status()
        ct = r.headers.get("content-type", "")
        if "application/json" in ct:
            return r.json()
        return r.text

