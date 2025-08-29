import os
import requests
import xmltodict
from dotenv import load_dotenv

load_dotenv()

KOPIS_BASE = "http://www.kopis.or.kr/openApi/restful/pblprfr"

# KOPIS 시도 코드(자주 쓰는 것 위주; 필요 시 확장)
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

def search_performances(stdate: str, eddate: str, city: str = "", gugun_code: str = "", rows: int = 50, page: int = 1):
    """
    KOPIS 공연목록 조회 (XML → dict)
    stdate/eddate: YYYYMMDD
    city: '광주광역시' 등 (시도코드 매핑)
    gugun_code: 구군 코드(선택)
    """
    service_key = os.getenv("KOPIS_API_KEY")
    if not service_key:
        return {"error": "KOPIS_API_KEY not set"}

    params = {
        "service": service_key,
        "stdate": stdate,
        "eddate": eddate,
        "rows": rows,
        "cpage": page,
    }

    if city and city in SIDO_CODE:
        params["signgucode"] = SIDO_CODE[city]
    if gugun_code:
        params["signgucodesub"] = gugun_code  # 없다면 미지정

    try:
        resp = requests.get(KOPIS_BASE, params=params, timeout=10)
        resp.raise_for_status()
        data = xmltodict.parse(resp.text)
        return data
    except Exception as e:
        return {"error": f"KOPIS request failed: {e}"}
