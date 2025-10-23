from fastapi import APIRouter, Query, Request, Response
from typing import Optional
from datetime import datetime, timedelta
import math
import os
import httpx

router = APIRouter()

# simple in-memory cache with parameter key
_cache: dict[str, dict] = {}
_ts: dict[str, float] = {}
_TTL = 300.0  # 5 minutes

def _today() -> str:
    return datetime.now().strftime("%Y%m%d")

def _bbox_from_center(lat: float, lng: float, radius_km: float):
    dlat = radius_km / 111.0
    dlng = radius_km / (111.0 * max(math.cos(math.radians(lat)), 1e-6))
    return (lng - dlng, lat - dlat, lng + dlng, lat + dlat)

@router.get("/nearby")
async def culture_nearby(
    request: Request,
    response: Response,
    lat: float = Query(...),
    lng: float = Query(...),
    radiusKm: float = Query(5.0, ge=0.5, le=50.0),
    from_: Optional[str] = Query(None, alias="from", description="YYYYMMDD"),
    to: Optional[str] = Query(None, description="YYYYMMDD"),
    keyword: str = Query("", description="optional keyword filter"),
):
    service_key = os.getenv("CULTURE_API_KEY")
    if not service_key:
        # 프론트 파서가 기대하는 구조로 빈 값 반환
        return {"response": {"body": {"items": {"item": []}}}}

    if not from_:
        from_ = _today()
    if not to:
        to = (datetime.now() + timedelta(days=14)).strftime("%Y%m%d")

    # cache key with rounded coordinates to increase hit rate
    rlat = round(lat, 2)
    rlng = round(lng, 2)
    key = f"{rlat}:{rlng}:{radiusKm}:{from_}:{to}:{keyword}"
    import time
    now = time.time()
    ts = _ts.get(key)
    if ts and (now - ts) < _TTL:
        etag = f'W/"cul-{int(ts)}"'
        if request.headers.get("if-none-match") == etag:
            return Response(status_code=304)
        response.headers["ETag"] = etag
        response.headers["Cache-Control"] = f"public, max-age={int(_TTL)}"
        return _cache.get(key, {"response": {"body": {"items": {"item": []}}}})

    xfrom, yfrom, xto, yto = _bbox_from_center(lat, lng, radiusKm)
    params = {
        "from": from_,
        "to": to,
        "cPage": 1,
        "rows": 50,
        "place": "",
        "gpsxfrom": f"{xfrom:.6f}",
        "gpsyfrom": f"{yfrom:.6f}",
        "gpsxto": f"{xto:.6f}",
        "gpsyto": f"{yto:.6f}",
        "keyword": keyword or "",
        "sortStdr": 1,
        "serviceKey": service_key,
    }

    url = "http://www.culture.go.kr/openapi/rest/publicperformancedisplays/period"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            # culture API는 JSON/XML 둘 다 가능 — 기본 JSON
            ct = r.headers.get("content-type", "")
            if "application/json" in ct:
                data = r.json()
            else:
                data = r.text  # type: ignore
            _cache[key] = data  # type: ignore[assignment]
            _ts[key] = now
            response.headers["ETag"] = f'W/"cul-{int(now)}"'
            response.headers["Cache-Control"] = f"public, max-age={int(_TTL)}"
            return data
    except Exception:
        # 네트워크 오류 시에도 실패 대신 빈 결과 반환
        return {"response": {"body": {"items": {"item": []}}}}
