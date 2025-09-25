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



## 배포 환경에서 데이터 유지하기

### 1) 영구 데이터베이스(PostgreSQL) 연결
- Render/Supabase/Neon 등에서 PostgreSQL 인스턴스를 생성하고 `DATABASE_URL`을 확보하세요.
- 배포 서비스 환경 변수에 `DATABASE_URL`을 등록하고, SQLite 폴백을 막기 위해 `ALLOW_SQLITE_FALLBACK=false`로 유지합니다. (`render.yaml`에 기본 포함)
- 최초 연결 시 테이블은 자동으로 생성됩니다. 기존 SQLite 데이터를 옮기려면 아래 스크립트를 사용하세요.

```
python scripts/migrate_sqlite_to_postgres.py --dest <postgres-connection-url>
```

### 2) 업로드 파일 영구 보관
- 기본 설정은 컨테이너 내부 `server/app/static/uploads`에 저장되며, 재배포 시 사라집니다.
- 두 가지 방법 중 하나를 선택하세요.
  1. **Persistent Disk 사용**: Render 등의 호스팅에서 디스크를 `/opt/data/uploads` 같은 경로에 마운트하고 `UPLOADS_DIR=/opt/data/uploads`, `UPLOADS_PUBLIC_PATH=/static/uploads`를 환경 변수로 지정하세요. 필요 시 `STATIC` 마운트 경로와 동일해야 합니다.
  2. **Supabase Storage 직접 사용 (무료)**: `UPLOADS_STORAGE=supabase`, `SUPABASE_URL=https://<project-ref>.supabase.co`, `SUPABASE_BUCKET=<버킷 이름>`, `SUPABASE_SERVICE_KEY=<service_role 키>`를 환경 변수에 추가하면 FastAPI가 Supabase Storage REST API로 바로 업로드합니다. 퍼블릭 URL을 커스텀하려면 `SUPABASE_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>`을, 경로 접두사는 `SUPABASE_STORAGE_PREFIX`로 변경할 수 있습니다.
  3. **S3 호환 스토리지 사용**: `UPLOADS_STORAGE=s3`, `UPLOADS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (또는 `AWS_DEFAULT_REGION`) 등을 설정하면 업로드가 S3/Supabase Storage 등으로 전송됩니다. 퍼블릭 URL을 커스텀하려면 `UPLOADS_S3_PUBLIC_BASE`를 지정할 수 있습니다.

### 3) 배포 순서 요약
1. 영구 DB 생성 후 `DATABASE_URL` 설정
2. (필요 시) `scripts/migrate_sqlite_to_postgres.py`로 기존 데이터 마이그레이션
3. 업로드 스토리지 전략 결정 후 관련 환경 변수 설정
   - Supabase Storage 예시 (무료)
     ```
     UPLOADS_STORAGE=supabase
     SUPABASE_URL=https://<project-ref>.supabase.co
     SUPABASE_BUCKET=<버킷이름>
     SUPABASE_SERVICE_KEY=<service_role 키>
     SUPABASE_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public/<버킷이름>
     # 선택: 경로 접두사 (기본 uploads/)
     SUPABASE_STORAGE_PREFIX=uploads/
     ```
   - S3 호환 스토리지 예시
     ```
     UPLOADS_STORAGE=s3
     UPLOADS_S3_BUCKET=<버킷>
     UPLOADS_S3_ENDPOINT=https://<endpoint>
     UPLOADS_S3_PUBLIC_BASE=https://<public-domain>/<버킷>
     AWS_ACCESS_KEY_ID=<key>
     AWS_SECRET_ACCESS_KEY=<secret>
     AWS_REGION=<region>
     ```
4. 서비스 재배포 → 로그인/이미지 업로드가 재배포 후에도 유지됩니다
