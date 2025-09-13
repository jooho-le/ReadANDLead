import requests
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# 환경변수 불러오기
load_dotenv()
KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")

headers = {
    "Authorization": f"KakaoAK {KAKAO_API_KEY}"
}

book_titles = [
    "소년이 온다", "작별하지 않는다", "태백산맥", "토지", "동백꽃 필 무렵", "순이삼촌",
    "오래 준비해온 대답", "자전거 도둑", "칼의 노래", "아리랑", "난장이가 쏘아올린 작은 공",
    "우리들의 일그러진 영웅", "1984년 서울", "82년생 김지영", "돌이킬 수 없는 약속",
    "가면산장 살인사건", "비밀의 화원", "소년이여 야망을 가져라", "밤의 여행자들", "폭풍의 언덕",
    "국수", "검은 꽃", "정글만리", "열하일기", "유랑지구", "파도가 바다의 일이라면",
    "하얼빈", "흑산", "남한산성", "이순신의 7년", "역사의 쓸모", "대한민국 근현대사",
    "역사 속 숨은 장소들", "경성 탐정록", "도시는 무엇으로 사는가", "철도원 삼대", "봄날",
    "지상의 노래", "타인의 집", "아무튼, 문학", "봉제인형 살인사건", "공터에서", "작은 아씨들",
    "망원동 브라더스", "유랑의 달", "두 도시 이야기", "월든", "메밀꽃 필 무렵", "소나기"
]

results = {}

for title in book_titles:
    url = f"https://dapi.kakao.com/v3/search/book?query={title} 소설&size=1"
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        documents = data.get("documents", [])
        if documents:
            book = documents[0]
            results[title] = {
                "title": book.get("title"),
                "authors": book.get("authors"),
                "publisher": book.get("publisher"),
                "isbn": book.get("isbn"),
                "contents": book.get("contents"),
                "thumbnail": book.get("thumbnail")
            }
        else:
            results[title] = {"error": "No result found"}
    except Exception as e:
        results[title] = {"error": str(e)}

# 저장
output_path = Path(__file__).parent.parent / "data" / "book_metadata_kakao.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("✅ 메타데이터 수집 완료 →", output_path.name)
