import os
import requests
import xmltodict
from dotenv import load_dotenv

load_dotenv()

NLK_SASEO = "https://www.nl.go.kr/NL/search/openApi/saseoApi.do"

def get_librarian_picks(start_date: str, end_date: str, dr_code: int = 11, start: int = 1, end: int = 20):
    """
    국립중앙도서관 사서추천도서 Open API
    dr_code: 11=문학, 6=인문, 5=사회, 4=자연
    """
    key = os.getenv("NLK_API_KEY")
    if not key:
        return {"error": "NLK_API_KEY not set"}

    params = {
        "key": key,
        "startRowNumApi": start,
        "endRowNemApi": end,
        "start_date": start_date,
        "end_date": end_date,
        "drcode": dr_code,
    }

    try:
        resp = requests.get(NLK_SASEO, params=params, timeout=10)
        resp.raise_for_status()
        data = xmltodict.parse(resp.text)
        return data
    except Exception as e:
        return {"error": f"NLK request failed: {e}"}
