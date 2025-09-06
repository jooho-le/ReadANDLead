from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta
import os
import httpx
import xmltodict

router = APIRouter()

SIDO_CODE = {
    "서울특별시": "11",
    "부산광역시": "26",
    "대구광역시": "27",
    "인천광역시": "28",
    "광주광역시": "29",
    "대전광역시": "30",
    "울산광역시": "31",
    "세종특별자치시": "36",
    "경기도": "41",
    "강원도": "42",
    "충청북도": "43",
    "충청남도": "44",
    "전라북도": "45",
    "전라남도": "46",
    "경상북도": "47",
    "경상남도": "48",
    "제주특별자치도": "50",
}

def _today() -> str:
    return datetime.now().strftime("%Y%m%d")

@router.get("/perform")
async def perform(
    city: str = Query("", description="예: 광주광역시 / 서울특별시"),
    from_: Optional[str] = Query(None, alias="from", description="YYYYMMDD"),
    to: Optional[str] = Query(None, description="YYYYMMDD"),
    rows: int = Query(30, ge=1, le=200),
    page: int = Query(1, ge=1),
    gugun_code: str = Query("", description="KOPIS 구군 코드(선택)"),
):
    service_key = os.getenv("KOPIS_API_KEY")
    if not service_key:
        return {"error": "KOPIS_API_KEY not set"}

    if not from_:
        from_ = _today()
    if not to:
        to = (datetime.now() + timedelta(days=14)).strftime("%Y%m%d")

    params = {
        "service": service_key,
        "stdate": from_,
        "eddate": to,
        "rows": rows,
        "cpage": page,
    }
    if city and city in SIDO_CODE:
        params["signgucode"] = SIDO_CODE[city]
    if gugun_code:
        params["signgucodesub"] = gugun_code

    url = "http://www.kopis.or.kr/openApi/restful/pblprfr"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        txt = r.text
        try:
            return xmltodict.parse(txt)
        except Exception:
            return {"raw": txt}

