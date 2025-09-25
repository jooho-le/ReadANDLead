# Read & Lead

문학 작품 속 내용을 바탕으로 떠나는 여행 서비스
여행지, 여행코스, 커뮤니티 제공 서비스 

# 서비스 기능
- 책으로 장소 찾기 기능 : 입력 키워드(도서명)와 연관된 장소 검색 및 관광지 추천
- 장소로 책 찾기 기능 : 입력 키워드(장소)로 연관된 책 검색 및 관광지 추천 
- 여행 퀘스트북 : AI가 제공하는 여행 일정에 맞춰 미션을 수행하며 리워드 획득 
- 인생네컷 : 문학 여행 중 찍은 사진을 인생네컷 형식으로 제작해 저장 및 SNS 공유 
- 관광사와 함께하는 문학 여행 : 관광사를 연계하여 문학 작품 기반 여행 코스 안내 및 여행 방향 제시 
- 이웃의 책 여행 따라가기 : 다른 사용자들의 문학 여행 글을 보고 소통 및 코스를 따라가며 공감을 형성 

# 프로젝트 구조
## Read & Lead 프로젝트 구조

```text
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
│  │  │  │  └─ AutocompleteInput.tsx           # 재사용 자동완성 입력
│  │  │  ├─ discovery/
│  │  │  │  ├─ DiscoveryPanelKakao.tsx         # 추천 패널
│  │  │  │  ├─ useKakaoMarkers.ts              # 카카오 마커 그룹 관리
│  │  │  │  └─ useMarkers.ts                   # 범용 마커 훅
│  │  │  ├─ map/
│  │  │  │  └─ KakaoMap.tsx                    # Kakao 지도 컨테이너
│  │  │  ├─ routes/
│  │  │  │  ├─ RoutePlannerDialog.tsx          # 경로 계획 다이얼로그
│  │  │  │  └─ RouteSidebar.tsx                # 경유지 사이드바
│  │  │  └─ diary/
│  │  │     ├─ TravelDiaryTab.tsx              # 일기 탭
│  │  │     ├─ DiaryTimeline.tsx               # 타임라인
│  │  │     ├─ DiaryComposer.tsx               # 일기 작성
│  │  │     └─ DiaryEntryCard.tsx              # 일기 카드
│  │  ├─ data/
│  │  │  ├─ book_location_event.json           # 도서 → 장소/이벤트 매핑
│  │  │  └─ neighbor_posts.json                # 이웃글 샘플
│  │  ├─ pages/
│  │  │  ├─ LocationMap.tsx                    # 책 검색 + 지도 + 패널
│  │  │  ├─ Home.tsx
│  │  │  ├─ Neighbors.tsx
│  │  │  ├─ NeighborPost.tsx
│  │  │  ├─ NeighborCompose.tsx
│  │  │  ├─ TravelDiary.tsx
│  │  │  ├─ DiaryTripPage.tsx
│  │  │  ├─ MyTrips.tsx
│  │  │  ├─ AgencyTrips.tsx
│  │  │  ├─ AgencyTripDetail.tsx
│  │  │  ├─ BookTripPage.tsx
│  │  │  ├─ BookTripDetailPage.tsx
│  │  │  ├─ PlaceToBook.tsx
│  │  │  ├─ FourCutCreator.tsx
│  │  │  └─ OAuthPopupCallback.tsx
│  │  ├─ hooks/useStops.ts
│  │  ├─ lib/utils.ts
│  │  ├─ utils/canvas.ts
│  │  ├─ types/kakao.d.ts
│  │  ├─ types/json.d.ts
│  │  ├─ styles/GlobalStyle.ts
│  │  ├─ App.tsx
│  │  ├─ index.tsx
│  │  ├─ App.css
│  │  ├─ index.css
│  │  ├─ setupTests.ts
│  │  └─ reportWebVitals.ts
│  ├─ public/manifest.json
│  ├─ package.json
│  └─ tsconfig.json
│
├─ server/                                     # 백엔드 앱(FastAPI)
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ database.py
│  │  ├─ models.py
│  │  ├─ schemas.py
│  │  ├─ security.py
│  │  ├─ deps.py
│  │  ├─ db.sqlite3
│  │  ├─ routers/
│  │  │  ├─ auth.py
│  │  │  ├─ posts.py
│  │  │  ├─ stats.py
│  │  │  ├─ culture.py
│  │  │  ├─ kopis.py
│  │  │  ├─ uploads.py
│  │  │  ├─ agency_trips.py
│  │  │  └─ trips.py
│  │  └─ static/
│  ├─ requirements.txt
│  ├─ run_gunicorn.sh
│  ├─ deploy/
│  │  ├─ nginx-api.conf.example
│  │  └─ systemd/readandlead-api.service.example
│  └─ .env
│
├─ data/
│  ├─ book_location_event.json
│  └─ book_metadata_kakao.json
│
├─ scripts/
│  ├─ book_metadata_collector.py
│  └─ delete_posts_by_title.py
│
├─ docs/
│  └─ ANDROID_RELEASE.md
│
├─ .gitignore
└─ README.md



