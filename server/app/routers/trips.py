# server/app/routers/trips.py
from openai import OpenAI
import os, re, json, math, requests, sqlite3, datetime
from fastapi import APIRouter, Body, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional

# ============== OpenAI / Kakao Config ==============
def _get_openai_client():
    """지연 초기화: 환경변수 없을 때는 None 반환(서버 기동 실패 방지)."""
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return None
    try:
        return OpenAI(api_key=key)
    except Exception as e:
        # 키가 잘못되었거나 초기화 실패 시 서버가 죽지 않도록 경고만 남김
        print("WARN OpenAI init failed:", e)
        return None

KAKAO_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"
print("DEBUG Init (keys exist):", bool(os.getenv("OPENAI_API_KEY")), bool(KAKAO_KEY))

router = APIRouter()

# ========================== 데이터 모델 ==========================
class StopItem(BaseModel):
    time: Optional[str] = None
    title: str
    # 확정 필드(프론트 렌더 기준)
    place: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None
    mission: Optional[str] = None
    # 부가정보(있으면 표출)
    address: Optional[str] = None
    phone: Optional[str] = None
    url: Optional[str] = None
    hours: Optional[str] = None
    source: Optional[str] = None
    place_id: Optional[str] = None
    # 1단계 초안용(최종 응답엔 제거)
    place_query: Optional[dict] = None
    # 내부 힌트(LLM/보정용) - 요청/응답 스키마에는 포함 안 됨
    theme_hint: Optional[str] = None
    global_hint: Optional[str] = None

class DayPlan(BaseModel):
    day: int
    theme: Optional[str] = None
    date: Optional[str] = None
    stops: List[StopItem] = []

class TravelPlan(BaseModel):
    summary: str
    days: List[DayPlan]

class PlanInput(BaseModel):
    bookTitle: str
    travelers: int
    days: int
    theme: str

# ========================== 간단 영속 저장소(sqlite) ==========================
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db.sqlite3"))

def _conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # trips
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS trips (
            user_id INTEGER NOT NULL,
            trip_id TEXT NOT NULL,
            book_title TEXT,
            theme TEXT,
            days INTEGER,
            created_at TEXT NOT NULL,
            PRIMARY KEY(user_id, trip_id)
        )
        """
    )
    # trip_stops
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS trip_stops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trip_id TEXT NOT NULL,
            day INTEGER,
            idx INTEGER,
            title TEXT,
            mission TEXT,
            place TEXT,
            lat REAL, lng REAL,
            status TEXT DEFAULT 'pending',
            proof_url TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    # rewards
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trip_id TEXT NOT NULL,
            book_title TEXT,
            claimed_at TEXT NOT NULL
        )
        """
    )
    return conn

def _utcnow():
    return datetime.datetime.utcnow().isoformat()

# ========================== 책 리서치 (Wikipedia/Google Books) ==========================
WIKI_SEARCH_API = "https://ko.wikipedia.org/w/api.php"
WIKI_SUMMARY_API = "https://ko.wikipedia.org/api/rest_v1/page/summary/"
GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"

def _wiki_summary_ko(title: str) -> Optional[str]:
    try:
        r = requests.get(WIKI_SEARCH_API, params={
            "action": "query", "list": "search", "srsearch": title,
            "format": "json", "utf8": 1, "srlimit": 1
        }, timeout=6)
        r.raise_for_status()
        hits = r.json().get("query", {}).get("search", [])
        if not hits:
            return None
        page_title = hits[0]["title"]
        r2 = requests.get(WIKI_SUMMARY_API + requests.utils.quote(page_title), timeout=6)
        if r2.status_code == 404:
            return None
        r2.raise_for_status()
        js = r2.json()
        return js.get("extract")
    except Exception:
        return None

def _google_books_brief(title: str) -> Optional[str]:
    try:
        r = requests.get(GOOGLE_BOOKS_API, params={
            "q": title, "maxResults": 3, "langRestrict": "ko"
        }, timeout=6)
        r.raise_for_status()
        items = r.json().get("items", [])
        if not items:
            return None
        vol = items[0].get("volumeInfo", {})
        desc = vol.get("description") or ""
        cats = ", ".join(vol.get("categories", []) or [])
        authors = ", ".join(vol.get("authors", []) or [])
        parts = []
        if authors: parts.append(f"저자: {authors}")
        if cats: parts.append(f"분류: {cats}")
        if desc: parts.append(f"개요: {desc}")
        return " / ".join(parts)[:1200]
    except Exception:
        return None

def _google_books_meta(title: str) -> dict:
    """간단 메타(저자, 표지 썸네일) 조회"""
    try:
        r = requests.get(GOOGLE_BOOKS_API, params={
            "q": title, "maxResults": 1, "langRestrict": "ko"
        }, timeout=6)
        r.raise_for_status()
        items = r.json().get("items", [])
        if not items:
            return {}
        vol = items[0].get("volumeInfo", {})
        author = ", ".join(vol.get("authors", []) or [])
        cover = (vol.get("imageLinks", {}) or {}).get("thumbnail") or (vol.get("imageLinks", {}) or {}).get("smallThumbnail")
        return {"author": author, "cover_url": cover}
    except Exception:
        return {}

def fetch_book_context(book_title: str) -> str:
    wiki = _wiki_summary_ko(book_title)
    gbooks = _google_books_brief(book_title)
    context = []
    if wiki: context.append(f"[Wikipedia-KO]\n{wiki}")
    if gbooks: context.append(f"[GoogleBooks]\n{gbooks}")
    return "\n\n".join(context) if context else ""

def extract_background_hints(text: str) -> str:
    """컨텍스트에서 배경 후보(도시/구/핵심 지명) 단어만 간단 추출"""
    if not text:
        return ""
    cues = [
        "서울","종로","중구","마포","영등포","을지로","청계천","세운상가","남산","남산타워",
        "한강","전주","부산","춘천","하동","광주","대전","대구","인천","울산","제주"
    ]
    found = [w for w in cues if w in text]
    # 중복 제거, 순서 유지
    out, seen = [], set()
    for w in found:
        if w not in seen:
            seen.add(w)
            out.append(w)
    return ", ".join(out)[:200]

# ========================== 카테고리/키워드 보정 규칙 ==========================
CATEGORY_MAP = {
    # 음식/주점
    "음식": "한식당", "식당": "한식당", "현지 식당": "한식당", "맛집": "한식당",
    "주점": "막걸리집", "술집": "막걸리집", "막걸리": "막걸리집", "분식집": "분식",
    # 문화 시설
    "문학": "문학관", "전시": "전시관", "박물관": "박물관", "도서관": "도서관", "서점": "서점",
    # 장소/자연
    "공원": "공원", "한옥": "한옥", "전망": "전망대", "산책": "공원",
    # 카페/빵집 등
    "카페": "카페", "빵": "빵집",
    # 기타
    "성당": "성당", "시장": "시장",
}
KEYWORD_BANLIST = {"근처", "인근", "유명", "핫플", "추천", "가까운", "최고", "베스트", "좋은", "멋진"}

# ===== 책 → 도시/행정구 간단 가제터 + 정규식 힌트 =====
BOOK_CITY_GAZETTEER = {
    "망원동": "서울 마포구",
    "홍대": "서울 마포구",
    "종로": "서울 종로구",
    "동백꽃": "강원 춘천시",  # 김유정
    "평사리": "경남 하동군",  # 토지
    "전주": "전북 전주시",
    "부산": "부산",
}
CITY_WORDS = ["서울","부산","대구","인천","광주","대전","울산","세종","제주",
              "춘천","전주","하동","마포","종로","망원","홍대"]
CITY_RE = re.compile("|".join(map(re.escape, CITY_WORDS)))

def guess_city_from_book(book_title: str, theme_hint: str = "", title_hint: str = "") -> Optional[str]:
    text = " ".join([book_title or "", theme_hint or "", title_hint or ""])
    for k, city in BOOK_CITY_GAZETTEER.items():
        if k in text:
            return city
    m = CITY_RE.search(text)
    if not m: return None
    w = m.group(0)
    if w in {"망원", "마포", "홍대"}: return "서울 마포구"
    if w == "종로": return "서울 종로구"
    if w == "춘천": return "강원 춘천시"
    return w

# 주소 힌트(도시/구/동) 추정 정규식
ADDR_PAT = re.compile(
    r"(서울|부산|대구|인천|광주|대전|울산|세종|제주)[^\s,]*(시|특별시|광역시)?\s*[가-힣0-9]*\s*(구|군|시|동)?"
    r"|[가-힣]+시\s*[가-힣]*구|[가-힣]+구\s*[가-힣]*동"
)

def guess_city_from_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    m = ADDR_PAT.search(text)
    return m.group(0).strip() if m else None

def normalize_category(cat: Optional[str]) -> Optional[str]:
    if not cat:
        return None
    c = cat.strip().lower()
    for key, val in CATEGORY_MAP.items():
        if key in c:
            return val
    if c in {"문학관","박물관","전시관","도서관","서점","시장","성당","한옥","공원","전망대",
             "카페","빵집","한식당","분식","막걸리집","양식","중식","일식"}:
        return c
    return None

def normalize_keywords(kws: Optional[List[str]]) -> List[str]:
    if not kws:
        return []
    cleaned = []
    for w in kws:
        if not isinstance(w, str):
            continue
        ww = w.strip()
        if not ww:
            continue
        if any(bad in ww for bad in KEYWORD_BANLIST):
            continue
        cleaned.append(ww)
    dedup, seen = [], set()
    for w in cleaned:
        lw = w.lower()
        if lw not in seen:
            seen.add(lw)
            dedup.append(w)
    return dedup[:3]

def normalize_place_query(pq: Optional[dict]) -> dict:
    pq = pq or {}
    city = (pq.get("city") or "").strip()

    if not city:
        city = (
            guess_city_from_book(
                (pq.get("global_hint") or ""),  # bookTitle
                (pq.get("theme_hint") or ""),
                (pq.get("title_hint") or "")
            )
            or guess_city_from_text(pq.get("title_hint"))
            or guess_city_from_text(pq.get("theme_hint"))
            or guess_city_from_text(pq.get("global_hint"))
            or city
        )

    if city == "서울":
        city = "서울 종로구"

    cat = normalize_category(pq.get("category"))
    kws = normalize_keywords(pq.get("keywords"))
    if not cat:
        title_hint = (pq.get("title_hint") or "").lower()
        cat = normalize_category(title_hint) or "공원"

    return {
        "city": city or None,
        "category": cat,
        "keywords": kws,
        "must_be_real": True
    }

# ========================== Kakao 검색 ==========================
def search_place_kakao(query: str, city: Optional[str] = None):
    if not KAKAO_KEY:
        return []
    headers = {"Authorization": f"KakaoAK {KAKAO_KEY}"}
    q = query if not city else f"{city} {query}"
    try:
        r = requests.get(
            KAKAO_URL,
            headers=headers,
            params={"query": q, "size": 5, "page": 1},
            timeout=8,
        )
        r.raise_for_status()
        docs = r.json().get("documents", [])
        res = []
        for d in docs[:2]:
            res.append({
                "name": d.get("place_name"),
                "address": d.get("road_address_name") or d.get("address_name"),
                "lat": float(d["y"]) if d.get("y") else None,
                "lng": float(d["x"]) if d.get("x") else None,
                "phone": d.get("phone"),
                "url": d.get("place_url"),
                "hours": None,
                "source": "kakao_places",
                "place_id": d.get("id"),
            })
        return res
    except Exception as e:
        print("WARN Kakao search error:", e)
        return []

def resolve_stop_place(stop: dict) -> dict:
    pq = stop.get("place_query") or {}

    # 힌트 3종 삽입: 타이틀/테마/책제목
    pq["title_hint"]  = stop.get("title", "")
    pq["theme_hint"]  = stop.get("theme_hint", "")
    pq["global_hint"] = stop.get("global_hint", "")

    pq = normalize_place_query(pq)

    city = pq.get("city")
    cat  = pq.get("category") or ""
    kws  = " ".join(pq.get("keywords") or [])
    base_query = f"{cat} {kws}".strip() or cat or stop.get("title", "")

    # 1차: 카테고리+키워드(+도시)
    cands = search_place_kakao(base_query, city=city)
    # 2차: 타이틀(+도시)
    if not cands:
        title_q = (stop.get("title") or "").strip()
        if title_q:
            cands = search_place_kakao(title_q, city=city)
    # 3차: 타이틀(도시 없이)
    if not cands:
        title_q = (stop.get("title") or "").strip()
        if title_q:
            cands = search_place_kakao(title_q, city=None)

    if cands:
        best = cands[0]
        stop["place"]   = best["name"]
        stop["address"] = best["address"]
        stop["lat"]     = best["lat"]
        stop["lng"]     = best["lng"]
        stop["phone"]   = best["phone"]
        stop["url"]     = best["url"]
        stop["hours"]   = best["hours"]
        stop["source"]  = best["source"]
        stop["place_id"]= best["place_id"]

    # place_query는 최종 응답에서 제거
    stop.pop("place_query", None)
    # 내부 힌트도 제거
    stop.pop("theme_hint", None)
    stop.pop("global_hint", None)
    return stop

# ========================== 동선 근사 최적화(탐욕) ==========================
def _dist(a: dict, b: dict) -> float:
    if not a or not b:
        return 9e9
    if a.get("lat") is None or b.get("lat") is None:
        return 9e9
    return math.hypot((a["lat"] or 0) - (b["lat"] or 0), (a["lng"] or 0) - (b["lng"] or 0))

def sort_stops_by_distance(stops: List[dict]) -> List[dict]:
    with_geo = [s for s in stops if s.get("lat") is not None and s.get("lng") is not None]
    if len(with_geo) <= 1:
        return stops
    path = [with_geo.pop(0)]
    while with_geo:
        last = path[-1]
        nxt = min(with_geo, key=lambda s: _dist(last, s))
        path.append(nxt)
        with_geo.remove(nxt)
    placed = set(map(id, path))
    rest = [s for s in stops if id(s) not in placed]
    return path + rest

# ========================== 유틸: JSON 강제 파서(강화) ==========================
def coerce_json_any(raw: str) -> dict:
    s = (raw or "").strip()

    if s.startswith("```"):
        s = s.strip().strip("`")
        if s.lower().startswith("json"):
            s = s[4:].strip()

    first = s.find("{")
    last  = s.rfind("}")
    if first == -1 or last == -1 or last <= first:
        return {"summary": "", "days": []}
    s = s[first:last+1]

    try:
        data = json.loads(s)
    except Exception:
        s2 = s.replace("\ufeff", "").replace("\r", "")
        try:
            data = json.loads(s2)
        except Exception:
            return {"summary": "", "days": []}

    if not isinstance(data, dict):
        data = {}
    if "summary" not in data or not isinstance(data.get("summary"), str):
        bs = data.get("book_summary")
        if isinstance(bs, dict):
            title = bs.get("title") or ""
            plot  = bs.get("plot") or bs.get("summary") or ""
            data["summary"] = (f"{title} 기반 여행 요약: {plot}".strip() or "")
        data.setdefault("summary", "")
    if "days" not in data or not isinstance(data.get("days"), list):
        data["days"] = []
    return data

# ========================== 프롬프트 (컨텍스트 주입 버전) ==========================
PROMPT_DRAFT = """당신은 문학 여행 기획자이자 게이미피케이션 전문가입니다.
아래 책 정보를 먼저 ‘읽고’, 책의 배경 지역(도시/구/핵심 지명)을 뽑아 경로를 설계하세요.
**실제 상호/주소/좌표는 쓰지 말고**, 각 stop마다 서버가 조회할 수 있도록 place_query만 작성합니다.
단, title/notes/mission에는 책과 직접 연결되는 **실제 지명**(예: 청계천, 세운상가, 남산타워, 한강대교 등)을 명시하세요.

[책 컨텍스트]
{bookContext}

[배경 후보 키워드]
{backgroundHints}

초안 JSON 스키마(정확히 이 구조로만 출력; 코드블록/설명 금지):
{{
  "summary": "책과 여행을 연결한 요약(실제 지명 포함 권장)",
  "days": [
    {{
      "day": 1,
      "theme": "테마",
      "stops": [
        {{
          "time": "HH:MM",
          "title": "코스 제목(실제 지명 포함)",
          "place_query": {{
            "city": "도시/행정구 (예: 서울 종로구 / 서울 중구 / 서울 마포구 / 전주 등)",
            "category": "장소 유형 (문학관/박물관/시장/카페/한식당/전망대/공원/산책로/다리…)",
            "keywords": ["인접 랜드마크", "구역", "동선 힌트(예: 청계천 벽화, 세운상가, 남산타워, 한강대교)"],
            "must_be_real": true
          }},
          "notes": "책 속 장면과 실제 지명 연결 설명",
          "mission": "실제 지명 포함 인증 미션(사진/영상/SNS/리워드)"
        }}
      ]
    }}
  ]
}}

제약:
- **JSON만** 출력 (설명/마크다운 금지)
- 불필요 키(book_summary/tips/itinerary 등) 금지
- 같은 지역은 인접 순서, 오전→점심→오후→저녁 흐름
- 각 stop마다 미션 1개 이상 (실제 지명 반드시 포함)

입력:
- 책 제목: {bookTitle}
- 여행 인원: {travelers}명
- 여행 기간: {days}일
- 여행 테마: {theme}
"""

# ========================== LLM 호출(초안) ==========================
def call_llm_for_draft(inp: PlanInput) -> dict:
    client = _get_openai_client()
    if client is None:
        # 키가 없으면 상위에서 예외 처리하여 fallback 사용
        raise RuntimeError("OPENAI_API_KEY missing; using fallback plan")
    # 책 컨텍스트/배경 힌트 주입
    book_ctx = fetch_book_context(inp.bookTitle)
    hints = extract_background_hints(book_ctx or "") or (guess_city_from_book(inp.bookTitle) or "") or "서울"

    prompt = PROMPT_DRAFT.format(
        bookContext = book_ctx or "(검색 결과 없음)",
        backgroundHints = hints,
        **inp.model_dump()
    )

    # 1) strict JSON 모드
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return ONLY JSON. No markdown, no code fences, no commentary."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.6,
            max_tokens=2000,
        )
        txt = (resp.choices[0].message.content or "").strip()
        return coerce_json_any(txt)
    except Exception as e:
        print("WARN json_object mode failed:", e)

    # 2) 일반 모드 → 강제 파싱
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Return ONLY JSON. No markdown, no code fences, no commentary."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.6,
        max_tokens=2000,
    )
    txt = (resp.choices[0].message.content or "").strip()
    return coerce_json_any(txt)

# ========================== Fallback ==========================
def _fallback_plan(inp: PlanInput) -> TravelPlan:
    days: List[DayPlan] = []
    for d in range(1, inp.days + 1):
        days.append(DayPlan(
            day=d,
            theme=f"{inp.theme} 테마 Day {d}",
            stops=[
                StopItem(
                    time="09:30",
                    title=f"{inp.bookTitle} 배경지 산책 (청계천/세운상가 등)",
                    notes="책 속 배경과 연결된 장소",
                    mission="청계천 벽화/안내판 인증샷 → 도장",
                    place_query={"city": "서울 종로구", "category": "공원", "keywords": ["청계천", "산책로"], "must_be_real": True}
                ),
                StopItem(
                    time="12:30",
                    title="현지 식당 점심 (을지로/종로)",
                    notes="책 속 음식과 연계",
                    mission="책 등장 음식 주문/사진 인증 → 리워드",
                    place_query={"city": "서울 종로구", "category": "한식당", "keywords": ["을지로", "전통"], "must_be_real": True}
                ),
                StopItem(
                    time="15:00",
                    title="문학/도시사 전시",
                    notes="작가/작품/도시 재개발 역사 전시 관람",
                    mission="마음에 남는 설명문/구절 촬영·요약 업로드",
                    place_query={"city": "서울 중구", "category": "전시관", "keywords": ["세운상가", "을지로"], "must_be_real": True}
                ),
                StopItem(
                    time="19:00",
                    title="남산타워/한강 야경",
                    notes="하루 마무리 산책",
                    mission="야경 인증샷 + '내 작은 공' 한 줄 소감",
                    place_query={"city": "서울 용산구", "category": "전망대", "keywords": ["남산타워","야경"], "must_be_real": True}
                ),
            ]
        ))
    return TravelPlan(
        summary=f"'{inp.bookTitle}' 기반 {inp.days}일 {inp.theme} 여행(실제 장소는 Kakao Places로 확정).",
        days=days
    )

# ========================== 메인 API ==========================
@router.post("/{trip_id}/plan", response_model=TravelPlan)
def generate_plan(trip_id: str, payload: PlanInput = Body(...)):
    try:
        # 1) LLM 초안 생성
        draft = call_llm_for_draft(payload)

        # 2) 최소 스키마 보정
        if not isinstance(draft, dict):
            draft = {}
        draft = {k: v for k, v in draft.items() if k in {"summary", "days"}}
        if "summary" not in draft or not isinstance(draft["summary"], str):
            draft["summary"] = f"{payload.bookTitle} 기반 여행 요약"
        if "days" not in draft or not isinstance(draft["days"], list):
            draft["days"] = []

        # 3) Kakao 확정 + 동선 정리
        normalized_days: List[dict] = []
        for idx, day in enumerate(draft["days"], start=1):
            if not isinstance(day, dict):
                continue
            day_out = {
                "day": day.get("day") if isinstance(day.get("day"), int) else idx,
                "theme": day.get("theme") if isinstance(day.get("theme"), str) else None,
                "date": day.get("date") if isinstance(day.get("date"), str) else None,
                "stops": [],
            }

            stops = day.get("stops") if isinstance(day.get("stops"), list) else []
            clean_stops: List[dict] = []
            for s in stops:
                if not isinstance(s, dict):
                    continue
                s.setdefault("time", None)
                s.setdefault("title", "코스")
                s.setdefault("notes", None)
                s.setdefault("mission", None)
                # Kakao 검색을 위한 힌트 주입
                s["theme_hint"]  = day_out["theme"] or (payload.theme or "")
                s["global_hint"] = payload.bookTitle or ""
                try:
                    s = resolve_stop_place(dict(s))
                except Exception as _e:
                    print("WARN resolve_stop_place:", _e)
                    s.pop("place_query", None)
                clean_stops.append(s)

            day_out["stops"] = sort_stops_by_distance(clean_stops)
            normalized_days.append(day_out)

        draft["days"] = normalized_days
        return TravelPlan(**draft)

    except Exception as e:
        print("DEBUG Error:", e)

        # 4) 예외 시: fallback 생성 후에도 Kakao 확정을 동일하게 적용
        fb = _fallback_plan(payload)         # TravelPlan
        draft = fb.model_dump()              # dict

        normalized_days: List[dict] = []
        for idx, day in enumerate(draft.get("days", []), start=1):
            if not isinstance(day, dict):
                day = dict(day)
            day_out = {
                "day": day.get("day") if isinstance(day.get("day"), int) else idx,
                "theme": day.get("theme"),
                "date": day.get("date"),
                "stops": [],
            }

            clean_stops: List[dict] = []
            for s in day.get("stops", []):
                s = dict(s)
                s["theme_hint"]  = day_out["theme"] or (payload.theme or "")
                s["global_hint"] = payload.bookTitle or ""
                try:
                    s = resolve_stop_place(s)
                except Exception as _e:
                    print("WARN resolve_stop_place in fallback:", _e)
                    s.pop("place_query", None)
                clean_stops.append(s)

            day_out["stops"] = sort_stops_by_distance(clean_stops)
            normalized_days.append(day_out)

        draft["summary"] = draft.get("summary") or f"{payload.bookTitle} 기반 여행 요약"
        draft["days"] = normalized_days
        return TravelPlan(**draft)


# ========================== Persist / Proof / Progress / Reward ==========================

class PersistInput(BaseModel):
    bookTitle: str
    theme: Optional[str] = None
    days: int
    # day별 stop(LLM 확정 결과) — 최소 필드만 저장
    stops: List[dict]

def _get_user_id_from_header() -> int:
    # 간소화: 토큰 인증 없이 데모 사용자 1 사용. 실제 운영은 deps.py 재사용 권장.
    return 1

@router.post("/{trip_id}/persist")
def persist_trip(trip_id: str, payload: PersistInput):
    user_id = _get_user_id_from_header()
    conn = _conn()
    now = _utcnow()
    # 동일 trip_id의 이전 스톱 제거(요청: 새 계획으로 덮어쓰기)
    conn.execute("DELETE FROM trip_stops WHERE user_id=? AND trip_id=?", (user_id, trip_id))
    conn.execute(
        "INSERT OR REPLACE INTO trips(user_id, trip_id, book_title, theme, days, created_at) VALUES(?,?,?,?,?,?)",
        (user_id, trip_id, payload.bookTitle, payload.theme or "", int(payload.days), now),
    )
    # 기존 스톱은 유지(덮지 않음). 없는 것만 insert.
    inserted = []
    for d in payload.stops:
        day = int(d.get("day") or 0)
        stops = d.get("stops") or []
        for idx, s in enumerate(stops):
            title = (s.get("title") or "코스").strip()
            mission = (s.get("mission") or None)
            place = (s.get("place") or None)
            lat = s.get("lat")
            lng = s.get("lng")
            # 동일 title/idx에 항목이 있으면 skip
            cur = conn.execute(
                "SELECT id FROM trip_stops WHERE user_id=? AND trip_id=? AND day=? AND idx=?",
                (user_id, trip_id, day, idx),
            ).fetchone()
            if cur:
                inserted.append({"day": day, "idx": idx, "id": cur["id"]})
                continue
            conn.execute(
                """
                INSERT INTO trip_stops(user_id, trip_id, day, idx, title, mission, place, lat, lng, status, created_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?)
                """,
                (user_id, trip_id, day, idx, title, mission, place, lat, lng, "pending", now),
            )
            rid = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
            inserted.append({"day": day, "idx": idx, "id": rid})
    conn.commit()
    conn.close()
    return {"trip_id": trip_id, "stop_ids": inserted}

@router.get("/{trip_id}/mine")
def get_my_trip(trip_id: str):
    user_id = _get_user_id_from_header()
    conn = _conn()
    trip = conn.execute(
        "SELECT book_title, theme, days, created_at FROM trips WHERE user_id=? AND trip_id=?",
        (user_id, trip_id),
    ).fetchone()
    stops = conn.execute(
        "SELECT id, day, idx, title, mission, place, lat, lng, status, proof_url FROM trip_stops WHERE user_id=? AND trip_id=? ORDER BY day, idx",
        (user_id, trip_id),
    ).fetchall()
    conn.close()
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")
    return {
        "trip_id": trip_id,
        "book_title": trip["book_title"],
        "theme": trip["theme"],
        "days": trip["days"],
        "stops": [dict(r) for r in stops],
    }

class ProofIn(BaseModel):
    proof_url: str

@router.post("/{trip_id}/stops/{stop_id}/proof")
def submit_proof(trip_id: str, stop_id: int, payload: ProofIn):
    user_id = _get_user_id_from_header()
    conn = _conn()
    cur = conn.execute(
        "SELECT id FROM trip_stops WHERE id=? AND user_id=? AND trip_id=?",
        (stop_id, user_id, trip_id),
    ).fetchone()
    if not cur:
        conn.close()
        raise HTTPException(status_code=404, detail="stop not found")
    conn.execute(
        "UPDATE trip_stops SET status='success', proof_url=? WHERE id=?",
        (payload.proof_url, stop_id),
    )
    conn.commit()
    conn.close()
    return {"ok": True, "stop_id": stop_id, "status": "success", "proof_url": payload.proof_url}

@router.get("/{trip_id}/progress")
def get_progress(trip_id: str):
    user_id = _get_user_id_from_header()
    conn = _conn()
    trip = conn.execute(
        "SELECT book_title FROM trips WHERE user_id=? AND trip_id=?",
        (user_id, trip_id),
    ).fetchone()
    rows = conn.execute(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as succeeded FROM trip_stops WHERE user_id=? AND trip_id=?",
        (user_id, trip_id),
    ).fetchone()
    conn.close()
    total = int(rows["total"] or 0)
    succ = int(rows["succeeded"] or 0)
    percent = int(round((succ / total) * 100)) if total else 0
    return {
        "book_title": trip["book_title"] if trip else "",
        "total": total,
        "succeeded": succ,
        "percent": percent,
        "all_cleared": total > 0 and succ == total,
    }

@router.post("/{trip_id}/claim-reward")
def claim_reward(trip_id: str):
    user_id = _get_user_id_from_header()
    conn = _conn()
    rows = conn.execute(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as succ FROM trip_stops WHERE user_id=? AND trip_id=?",
        (user_id, trip_id),
    ).fetchone()
    total = int(rows["total"] or 0)
    succ = int(rows["succ"] or 0)
    if total == 0 or succ < total:
        conn.close()
        raise HTTPException(status_code=400, detail="not cleared")
    book = conn.execute(
        "SELECT book_title FROM trips WHERE user_id=? AND trip_id=?",
        (user_id, trip_id),
    ).fetchone()
    conn.execute(
        "INSERT INTO rewards(user_id, trip_id, book_title, claimed_at) VALUES(?,?,?,?)",
        (user_id, trip_id, (book["book_title"] if book else ""), _utcnow()),
    )
    conn.commit()
    conn.close()
    return {"ok": True, "message": f"'{(book['book_title'] if book else '')}' 미션 클리어! 리워드가 발급되었습니다."}

# -------------------- Book context (for nice popup) --------------------
@router.get("/book-context")
def get_book_context(title: str):
    # 원문 컨텍스트(위키/북스 요약 병합)
    ctx = fetch_book_context(title) or ""
    # 배경 키워드(도시/행정구)
    hints = extract_background_hints(ctx or "") or (guess_city_from_book(title) or "")
    # 메타(저자/표지)
    meta = _google_books_meta(title)
    author = (meta.get("author") or "").strip() or None
    cover_url = meta.get("cover_url")
    # 내용 요약: 첫 문장(국문 마침표 '다.' 또는 '.', '!', '?')를 한 문장으로
    content_src = re.sub(r"\s+", " ", ctx).strip()
    content = ""
    if content_src:
        m = re.search(r"(.+?(다\.|\.|!|\?))\s", content_src)
        content = (m.group(1) if m else content_src)
        content = content.strip()
    else:
        content = "관련 요약 정보를 찾지 못했습니다."
    return {"title": title, "author": author or "알 수 없음", "background": hints or "—", "content": content, "cover_url": cover_url}

# -------------------- Summary (my page) --------------------
@router.get("/summary")
def my_trips_summary():
    user_id = _get_user_id_from_header()
    conn = _conn()
    trips = conn.execute(
        "SELECT trip_id, book_title FROM trips WHERE user_id=? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    out = []
    for t in trips:
        trip_id = t["trip_id"]
        rows = conn.execute(
            "SELECT COUNT(*) as total, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as succ FROM trip_stops WHERE user_id=? AND trip_id=?",
            (user_id, trip_id),
        ).fetchone()
        proofs = conn.execute(
            "SELECT proof_url FROM trip_stops WHERE user_id=? AND trip_id=? AND proof_url IS NOT NULL ORDER BY id DESC LIMIT 3",
            (user_id, trip_id),
        ).fetchall()
        total = int(rows["total"] or 0)
        succ = int(rows["succ"] or 0)
        percent = int(round((succ/total)*100)) if total else 0
        out.append({
            "trip_id": trip_id,
            "book_title": t["book_title"],
            "total": total,
            "succeeded": succ,
            "percent": percent,
            "proofs": [r["proof_url"] for r in proofs if r["proof_url"]],
        })
    conn.close()
    return out

# 삭제: trip과 관련 데이터 일괄 제거
@router.delete("/{trip_id}")
def delete_trip(trip_id: str):
    user_id = _get_user_id_from_header()
    conn = _conn()
    conn.execute("DELETE FROM diary WHERE user_id=? AND trip_id=?", (user_id, trip_id))
    conn.execute("DELETE FROM trip_stops WHERE user_id=? AND trip_id=?", (user_id, trip_id))
    conn.execute("DELETE FROM rewards WHERE user_id=? AND trip_id=?", (user_id, trip_id))
    conn.execute("DELETE FROM trips WHERE user_id=? AND trip_id=?", (user_id, trip_id))
    conn.commit(); conn.close()
    return {"ok": True}


# ========================== Stops (for Itinerary panel) ==========================
@router.get("/{trip_id}/stops")
def list_stops(trip_id: str):
    user_id = _get_user_id_from_header()
    conn = _conn()
    rows = conn.execute(
        "SELECT id, day, idx, title, mission, place, lat, lng, status, proof_url FROM trip_stops WHERE user_id=? AND trip_id=? ORDER BY day, idx",
        (user_id, trip_id),
    ).fetchall()
    conn.close()
    out = []
    for r in rows:
        out.append({
            "id": r["id"],
            "tripId": trip_id,
            "placeId": str(r["id"]),
            "placeName": r["place"] or r["title"],
            "lat": r["lat"],
            "lng": r["lng"],
            "address": None,
            "date": None,
            "startTime": None,
            "notes": r["mission"],
        })
    return out


# ========================== Add single stop (manual/AI pick) ==========================
class AddStopIn(BaseModel):
    placeId: str
    date: Optional[str] = None
    startTime: Optional[str] = None
    notes: Optional[str] = None

@router.post("/{trip_id}/stops")
def add_stop(trip_id: str, payload: AddStopIn):
    user_id = _get_user_id_from_header()
    conn = _conn()
    # Try reading place info from places table (created via /api/places/upsert)
    try:
        prow = conn.execute(
            "SELECT id, name, address, lat, lng FROM places WHERE id=?",
            (int(payload.placeId),)
        ).fetchone()
    except Exception:
        prow = None

    name = (prow["name"] if prow else "장소")
    place = name
    lat = (float(prow["lat"]) if (prow and prow["lat"] is not None) else None)
    lng = (float(prow["lng"]) if (prow and prow["lng"] is not None) else None)
    now = _utcnow()

    # Append with next idx
    cur = conn.execute(
        "SELECT COALESCE(MAX(idx), -1) AS mi FROM trip_stops WHERE user_id=? AND trip_id=?",
        (user_id, trip_id)
    ).fetchone()
    next_idx = int(cur["mi"] or -1) + 1

    conn.execute(
        """
        INSERT INTO trip_stops(user_id, trip_id, day, idx, title, mission, place, lat, lng, status, created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
        """,
        (user_id, trip_id, None, next_idx, name, payload.notes or None, place, lat, lng, "pending", now)
    )
    rid = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
    conn.commit(); conn.close()
    return {
        "id": str(rid),
        "tripId": trip_id,
        "placeId": str(payload.placeId),
        "placeName": place,
        "lat": lat,
        "lng": lng,
        "address": None,
        "date": payload.date or None,
        "startTime": payload.startTime or None,
        "notes": payload.notes or None,
    }


# ========================== Diary (minimal) ==========================
def _ensure_diary(conn: sqlite3.Connection):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS diary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trip_id TEXT NOT NULL,
            stop_id INTEGER,
            entry_type TEXT,
            text TEXT,
            content TEXT,
            happened_at TEXT,
            created_at TEXT NOT NULL
        )
        """
    )

@router.get("/{trip_id}/diary")
def list_diary(trip_id: str):
    user_id = _get_user_id_from_header()
    conn = _conn(); _ensure_diary(conn)
    rows = conn.execute(
        "SELECT id, stop_id, entry_type, text, content, happened_at, created_at FROM diary WHERE user_id=? AND trip_id=? ORDER BY id DESC LIMIT 100",
        (user_id, trip_id),
    ).fetchall()
    conn.close()
    out = []
    for r in rows:
        out.append({
            "id": str(r["id"]),
            "trip_id": trip_id,
            "stop_id": r["stop_id"],
            "entry_type": r["entry_type"] or "note",
            "text": r["text"],
            "content": json.loads(r["content"]) if r["content"] else {},
            "happened_at": r["happened_at"],
            "created_at": r["created_at"],
            "author_id": str(user_id),
        })
    return out

class DiaryIn(BaseModel):
    entry_type: Optional[str] = "note"
    text: Optional[str] = None
    stop_id: Optional[int] = None
    happened_at: Optional[str] = None
    content: Optional[dict] = None

@router.post("/{trip_id}/diary")
def create_diary(trip_id: str, payload: DiaryIn):
    user_id = _get_user_id_from_header()
    conn = _conn(); _ensure_diary(conn)
    now = _utcnow()
    conn.execute(
        "INSERT INTO diary(user_id, trip_id, stop_id, entry_type, text, content, happened_at, created_at) VALUES(?,?,?,?,?,?,?,?)",
        (user_id, trip_id, payload.stop_id, payload.entry_type, payload.text, json.dumps(payload.content or {}), payload.happened_at, now),
    )
    rid = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
    conn.commit(); conn.close()
    return {"id": str(rid), "trip_id": trip_id, "author_id": str(user_id), "entry_type": payload.entry_type, "text": payload.text, "content": payload.content or {}, "happened_at": payload.happened_at, "created_at": now}
