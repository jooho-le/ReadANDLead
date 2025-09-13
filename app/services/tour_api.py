import requests
import os
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()

TOURAPI_BASE = "https://apis.data.go.kr/B551011/KorService1/searchKeyword1"

def search_tourapi_by_keyword(keyword: str):
    SERVICE_KEY = os.getenv("TOURAPI_KEY")
    if not SERVICE_KEY:
        return {"error": "TOURAPI_KEY가 설정되지 않았습니다."}

    params = {
        "serviceKey": SERVICE_KEY,
        "MobileOS": "ETC",
        "MobileApp": "book2tour",
        "numOfRows": 5,
        "pageNo": 1,
        "keyword": keyword,
        "_type": "json"
    }

    try:
        response = requests.get(TOURAPI_BASE, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"TourAPI 요청 중 오류: {str(e)}"}
