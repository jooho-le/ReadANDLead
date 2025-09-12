from fastapi import APIRouter

router = APIRouter()


@router.get("/list")
def list_agency_trips():
    return [
        {
            "id": "hana-han-kang",
            "title": "하나투어와 함께 떠나는 한강 작가 스토리",
            "operator": "하나투어",
            "phone": "02-0000-0000",
            "link": "https://www.hanatour.com",
            "cover": "https://images.unsplash.com/photo-1485206412256-701ccc5b93ca?q=80&w=1200&auto=format&fit=crop",
            "intro": "한국 현대문학을 대표하는 작가 ‘한강’의 작품 세계를 따라 서울의 장소들을 걷는 감성 워킹 투어.",
            "author_note": "맨부커 국제상 수상작가. 대표작 ‘채식주의자’, ‘소년이 온다’. 상실과 치유의 정서를 공간과 함께 체험.",
            "itinerary": [
                "북촌 한옥길",
                "청계천",
                "종로 소설 배경지",
                "독립서점 북토크(선택)"
            ],
        },
        {
            "id": "mode-jeju-literature",
            "title": "모두투어와 떠나는 제주도 문학여행",
            "operator": "모두투어",
            "phone": "064-000-0000",
            "link": "https://www.modetour.com",
            "cover": "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop",
            "intro": "제주의 바다와 오름, 마을의 이야기 속에서 소설과 시를 만나는 2박 3일 코스.",
            "author_note": "제주를 배경으로 한 단편과 시를 중심으로 구성. 각 일자별 주제(바다·오름·마을)로 감성 일정.",
            "itinerary": [
                "성산 일출봉",
                "표선 해변",
                "한 책방 산책",
                "해녀박물관",
                "오름 트레킹",
                "골목 문학 포인트"
            ],
        },
    ]

