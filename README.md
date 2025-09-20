#Read & Lead

문학 작품 속 내용을 바탕으로 떠나는 여행 서비스
여행지, 여행코스, 커뮤니티 제공 서비스 

# 프로젝트 구조

Read & Lead
├─ react-frontend/                             # 프론트엔드 앱(React CRA)
│  ├─ public/
│  │  └─ index.html                            # 루트 HTML
│  ├─ src/
│  │  ├─ api/                                  # 외부 API 및 SDK 래퍼
│  │  │  ├─ config.ts                          # API 베이스/엔드포인트/공통 fetch
│  │  │  ├─ kakao.ts                           # Kakao JS SDK 로더·키워드/카테고리/지오코딩
│  │  │  ├─ googlePlaces.ts                    # (선택) 상세 보강: 사진/주소/평점
│  │  │  ├─ culture.ts                         # 문화포털 전시 프록시 클라이언트
│  │  │  ├─ kopis.ts                           # KOPIS 공연 프록시 클라이언트
│  │  │  ├─ directions.ts                      # 외부 길찾기 링크 유틸
│  │  │  ├─ auth.ts                            # 인증 API
│  │  │  ├─ neighbor.ts                        # 이웃글 API
│  │  │  ├─ diary.ts                           # 여행 일기 API
│  │  │  ├─ trips.ts                           # 여행/장소 저장·조회 API
│  │  │  ├─ stats.ts                           # 통계 API
│  │  │  └─ agency.ts                          # 제휴 여행상품 API
│  │  ├─ components/
│  │  │  ├─ common/
│  │  │  │  └─ AutocompleteInput.tsx           # 재사용 자동완성 입력(책/길찾기 제안)
│  │  │  ├─ discovery/
│  │  │  │  ├─ DiscoveryPanelKakao.tsx         # 추천 패널(공연/전시/박물관/카페/핫플·정렬/필터/상세/길찾기/일정추가)
│  │  │  │  ├─ useKakaoMarkers.ts              # 카카오 마커 그룹 관리(추가/지우기)
│  │  │  │  └─ useMarkers.ts                   # 범용 마커 훅(일부 페이지)
│  │  │  ├─ map/
│  │  │  │  └─ KakaoMap.tsx                    # Kakao 지도 컨테이너(onReady로 map 전달)
│  │  │  ├─ routes/
│  │  │  │  ├─ RoutePlannerDialog.tsx          # 경로 계획 다이얼로그
│  │  │  │  └─ RouteSidebar.tsx                # 경로/경유지 사이드바
│  │  │  └─ diary/
│  │  │     ├─ TravelDiaryTab.tsx              # 일기 탭
│  │  │     ├─ DiaryTimeline.tsx               # 타임라인
│  │  │     ├─ DiaryComposer.tsx               # 일기 작성
│  │  │     └─ DiaryEntryCard.tsx              # 일기 카드
│  │  ├─ data/
│  │  │  ├─ book_location_event.json           # 도서 → 관련 장소/이벤트 매핑
│  │  │  └─ neighbor_posts.json                # 이웃글 샘플 데이터
│  │  ├─ pages/
│  │  │  ├─ LocationMap.tsx                    # 책 검색 + 지도 + 추천 패널
│  │  │  ├─ Home.tsx                           # 홈
│  │  │  ├─ Neighbors.tsx                      # 이웃글 목록
│  │  │  ├─ NeighborPost.tsx                   # 이웃글 상세
│  │  │  ├─ NeighborCompose.tsx                # 이웃글 작성
│  │  │  ├─ TravelDiary.tsx                    # 여행일기 메인
│  │  │  ├─ DiaryTripPage.tsx                  # 특정 여행의 일기
│  │  │  ├─ MyTrips.tsx                        # 내 여행 목록
│  │  │  ├─ AgencyTrips.tsx                    # 제휴 여행상품
│  │  │  ├─ AgencyTripDetail.tsx               # 제휴 상품 상세
│  │  │  ├─ BookTripPage.tsx                   # 도서 기반 여행 플로우
│  │  │  ├─ BookTripDetailPage.tsx             # 도서 여행 상세
│  │  │  ├─ PlaceToBook.tsx                    # 장소→책 연결(유틸)
│  │  │  ├─ FourCutCreator.tsx                 # 4컷 생성(유틸)
│  │  │  └─ OAuthPopupCallback.tsx             # OAuth 팝업 콜백
│  │  ├─ hooks/useStops.ts                     # 스톱 상태 훅
│  │  ├─ lib/utils.ts                          # 범용 유틸
│  │  ├─ utils/canvas.ts                       # 캔버스 유틸
│  │  ├─ types/kakao.d.ts                      # Kakao 타입
│  │  ├─ types/json.d.ts                       # JSON import 타입
│  │  ├─ styles/GlobalStyle.ts                 # 글로벌 스타일
│  │  ├─ App.tsx                               # 라우팅/전역 레이아웃
│  │  ├─ index.tsx                             # 앱 엔트리
│  │  ├─ App.css                               # 전역 스타일
│  │  ├─ index.css                             # 전역 스타일
│  │  ├─ setupTests.ts                         # 테스트 설정
│  │  └─ reportWebVitals.ts                    # 웹 바이탈 리포팅
│  ├─ public/manifest.json                     # PWA 매니페스트
│  ├─ package.json
│  └─ tsconfig.json
│
├─ server/                                     # 백엔드 앱(FastAPI)
│  ├─ app/
│  │  ├─ main.py                               # FastAPI 엔트리/CORS/라우터/정적 마운트
│  │  ├─ database.py                           # DB 연결/세션
│  │  ├─ models.py                             # ORM 모델
│  │  ├─ schemas.py                            # Pydantic 스키마
│  │  ├─ security.py                           # JWT 등 보안 유틸
│  │  ├─ deps.py                               # 의존성 주입
│  │  ├─ db.sqlite3                            # SQLite DB(개발 기본)
│  │  ├─ routers/                              # API 라우터
│  │  │  ├─ auth.py                            # 인증(회원가입/로그인)
│  │  │  ├─ posts.py                           # 이웃글
│  │  │  ├─ stats.py                           # 통계(/api/users/count)
│  │  │  ├─ culture.py                         # 문화포털 프록시(/api/culture/nearby)
│  │  │  ├─ kopis.py                           # KOPIS 프록시(/api/kopis/perform)
│  │  │  ├─ uploads.py                         # 파일 업로드/정적
│  │  │  ├─ agency_trips.py                    # 제휴 여행상품
│  │  │  └─ trips.py                           # 여행/스톱/리워드
│  │  └─ static/                               # 업로드 정적 파일(런타임)
│  ├─ requirements.txt                         # 서버 의존성
│  ├─ run_gunicorn.sh                          # Gunicorn 실행 스크립트
│  ├─ deploy/
│  │  ├─ nginx-api.conf.example                # Nginx 리버스 프록시 예시
│  │  └─ systemd/readandlead-api.service.example # systemd 서비스 예시
│  └─ .env                                     # 서버 환경변수(로컬 예시)
│
├─ data/                                       # 데이터 세트
│  ├─ book_location_event.json                 # 도서→관련 장소/이벤트
│  └─ book_metadata_kakao.json                 # 책 메타데이터(수집본)
│
├─ scripts/                                    # 보조 스크립트
│  ├─ book_metadata_collector.py               # 책 메타 수집
│  └─ delete_posts_by_title.py                 # 제목 기준 글 삭제
│
├─ docs/                                       # 문서
│  └─ ANDROID_RELEASE.md                       # 안드로이드 릴리즈 가이드
│
├─ .gitignore                                  # node_modules, build, .env*, etc.
└─ README.md                                   # 프로젝트 소개와 이 구조 가이드

# 서비스 기능
- 책으로 장소 찾기 기능 : 입력 키워드(도서명)와 연관된 장소 검색 및 관광지 추천
- 장소로 책 찾기 기능 : 입력 키워드(장소)로 연관된 책 검색 및 관광지 추천 
- 여행 퀘스트북 : AI가 제공하는 여행 일정에 맞춰 미션을 수행하며 리워드 획득 
- 인생네컷 : 문학 여행 중 찍은 사진을 인생네컷 형식으로 제작해 저장 및 SNS 공유 
- 관광사와 함께하는 문학 여행 : 관광사를 연계하여 문학 작품 기반 여행 코스 안내 및 여행 방향 제시 
- 이웃의 책 여행 따라가기 : 다른 사용자들의 문학 여행 글을 보고 소통 및 코스를 따라가며 공감을 형성 

# 알고리즘
graph TD

  %% ===================== Frontend (React) =====================
  subgraph FE[Frontend (React CRA)]
    A[🚀 앱 로드] --> A1[🗺️ Kakao SDK 로드/초기화]
    A1 --> A2{📍 위치 권한?}
    A2 -- 예 --> A3[▶ 현재 위치 획득 → center 설정]
    A2 -- 아니오 --> A4[➡ 기본 중심(서울) 사용]
    A3 --> P[🧭 LocationMap 화면 렌더]
    A4 --> P

    %% Book → Location
    P --> B1[📚 책 제목 입력/자동완성]
    B1 --> B2[🧭 주소 지오코딩 or 키워드 검색]
    B2 --> B3[🗺️ 지도 중심 이동 + 책 마커/인포윈도우]

    %% Discovery Panel
    P --> C0[🧩 탐색 패널(카테고리 선택)]
    C0 -->|카페/핫플/박물관| C1[🔎 Kakao Places 카테고리 검색]
    C1 --> C2[📍 마커 추가 + 리스트 렌더]

    C0 -->|전시| EX_FE[📡 /api/culture/nearby 호출]
    C0 -->|공연| PR_FE[📡 /api/kopis/perform 호출]

    %% Item interactions
    I0[📄 목록 아이템] --> I1[🧭 지도 팬/줌 + 인포윈도우]
    I0 --> I2{🔎 상세 보기?}
    I2 -- 예 --> G1[🖼️ Google Places 상세(선택)]
    G1 --> G2[📷 사진/주소/평점/웹/전화 표시]

    I0 --> A0{⚙️ 액션}
    A0 --> D0[🧭 외부 길찾기 열기(카카오/네이버/구글)]
    A0 --> T0[🗂️ 여행에 추가]
    T0 --> AUTH{🔐 로그인됨?}
    AUTH -- 아니오 --> L0[👤 로그인/회원가입]
    AUTH -- 예 --> T1[🏷️ Place upsert] --> T2[🧩 Trip Stop 추가]
  end

  %% ===================== Backend (FastAPI) =====================
  subgraph BE[Backend (FastAPI)]
    BE0[/api/ping/]
    AUTH_BE[/api/auth/*/]
    POSTS_BE[/api/neighbor-posts/*/]
    STATS_BE[/api/users/count/]
    CULT_BE[/api/culture/nearby/]
    KOPIS_BE[/api/kopis/perform/]
    TRIPS_BE[/api/trips/*/]
    UP_BE[/api/uploads/*/]

    EX_FE --> CULT_BE
    PR_FE --> KOPIS_BE
    T1 --> TRIPS_BE
    T2 --> TRIPS_BE
  end

  %% ===================== External Data Sources =====================
  subgraph EXT[External Data Sources]
    KAKAO[Kakao Maps JS/Places]
    CULTAPI[문화공공데이터 포털]
    KOPISAPI[KOPIS 공연 API]
    GPLACES[Google Places API]
  end

  %% Frontend direct dependencies
  A1 --> KAKAO
  C1 --> KAKAO
  G1 --> GPLACES

  %% Backend proxies
  CULT_BE --> CULTAPI
  KOPIS_BE --> KOPISAPI

  %% Helpers
  classDef dim fill:#f6f8fa,stroke:#d0d7de,color:#24292f;
  class FE dim; class BE dim; class EXT dim;
