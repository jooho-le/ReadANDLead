import os
import math
import requests
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

BASE_PERIOD = "http://www.culture.go.kr/openapi/rest/publicperformancedisplays/period"

def _bbox_from_center(lat: float, lng: float, radius_km: float):
    # 위경도 단순 근사
    dlat = radius_km / 111.0
    dlng = radius_km / (111.0 * max(math.cos(math.radians(lat)), 1e-6))
    return (lng - dlng, lat - dlat, lng + dlng, lat + dlat)  # (xfrom,yfrom,xto,yto)

def search_events_nearby(lat: float, lng: float, radius_km: float, date_from: str, date_to: str, keyword: str = "", sortStdr: int = 1, rows: int = 50):
    """
    문화포털 공연/전시 기간 조회 + 좌표범위(gpsx/gpsy)로 근거리 결과 가져오기.
    date_from/date_to: YYYYMMDD
    """
    service_key = os.getenv("CULTURE_API_KEY")
    if not service_key:
        return {"error": "CULTURE_API_KEY not set"}

    xfrom, yfrom, xto, yto = _bbox_from_center(lat, lng, radius_km)

    params = {
        "from": date_from,
        "to": date_to,
        "cPage": 1,
        "rows": rows,
        "place": "",
        "gpsxfrom": f"{xfrom:.6f}",
        "gpsyfrom": f"{yfrom:.6f}",
        "gpsxto": f"{xto:.6f}",
        "gpsyto": f"{yto:.6f}",
        "keyword": keyword or "",
        "sortStdr": sortStdr,
        "serviceKey": service_key,  # URL 인코딩된 키
    }

    try:
        resp = requests.get(BASE_PERIOD, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json() if "application/json" in resp.headers.get("Content-Type","") else resp.text
    except Exception as e:
        return {"error": f"culture.go.kr request failed: {e}"}
