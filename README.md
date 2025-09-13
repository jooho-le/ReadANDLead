## 프로젝트 구조

```bash
├─ react-frontend/                       # 프론트엔드 앱(React CRA)
│  ├─ public/
│  │  └─ index.html                      # 루트 HTML
│  ├─ src/
│  │  ├─ api/                            # 외부 API 및 SDK 래퍼
│  │  │  ├─ kakao.ts                     # Kakao JS SDK 로더, geocode/keyword, reverseSido
│  │  │  ├─ culture.ts                   # 문화공공데이터(공연·전시) API 클라이언트
│  │  │  ├─ kopis.ts                     # KOPIS(공연예술통합전산망) API 클라이언트
│  │  │  ├─ googlePlaces.ts              # (선택) 상세 모달용 사진/주소 보강(Google Places)
│  │  │  └─ config.ts                    # API 엔드포인트·키 읽기(환경변수)
│  │  ├─ components/
│  │  │  ├─ common/
│  │  │  │  └─ AutocompleteInput.tsx     # 재사용 자동완성 입력 컴포넌트(책/길찾기 제안)
│  │  │  ├─ discovery/
│  │  │  │  ├─ DiscoveryPanelKakao.tsx   # 하단 추천 패널(공연/전시/박물관/카페/핫플·정렬·필터·길찾기·상세모달)
│  │  │  │  └─ useKakaoMarkers.ts        # 카카오 마커 관리 훅(추가/지우기/카테고리별 그룹핑)
│  │  │  └─ map/
│  │  │     └─ KakaoMap.tsx              # Kakao 지도 컨테이너(onReady로 map 인스턴스 전달)
│  │  ├─ data/
│  │  │  └─ book_location_event.json     # 도서 제목 → 관련 장소/이벤트 매핑 데이터
│  │  ├─ pages/
│  │  │  └─ LocationMap.tsx              # 상단 ‘책 검색’ + 지도 + 하단 추천 패널을 한 화면으로 구성
│  │  ├─ App.tsx                         # 라우팅/전역 레이아웃
│  │  └─ index.tsx                       # 앱 엔트리
│  ├─ .env.local.example                 # 환경변수 예시(배포용은 미포함)
│  ├─ package.json
│  └─ tsconfig.json
│
├─ docs/                                  # 문서(선택: 저장소 가이드/아키텍처/스프린트 노트 등)
│  ├─ architecture/
│  │  ├─ map-integration.md              # Google→Kakao 전환 배경/의사결정/한계
│  │  └─ apis.md                         # 사용 API 정리(Kakao/Culture/KOPIS/Google Places)
│  ├─ development/
│  │  └─ development-workflow.md         # 브랜치 전략, 커밋 컨벤션, 릴리즈 플로우
│  └─ product/
│     └─ feature-roadmap.md              # 기능 로드맵·백로그(추천/상세/길찾기 등)
│
├─ .gitignore                             # node_modules, build, .env*, etc.
└─ README.md                              # 프로젝트 소개와 이 구조 가이드
