const KAKAO_SRC = (key: string) =>
  `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services,clusterer`;

let kakaoLoaded: Promise<void> | null = null;

export async function loadKakaoSdk() {
  if (kakaoLoaded) return kakaoLoaded;
  const key = process.env.REACT_APP_KAKAO_JS_KEY;
  if (!key) {
    // 디버깅 도움: 빌드 타임에 키 미주입된 경우
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG_MAP') === '1') {
        // eslint-disable-next-line no-console
        console.error('[kakao] REACT_APP_KAKAO_JS_KEY 가 빌드 시 주입되지 않았습니다 (.env.production 확인)');
      }
    } catch {}
    throw new Error('REACT_APP_KAKAO_JS_KEY 가 필요합니다');
  }

  kakaoLoaded = new Promise<void>((resolve, reject) => {
    if (window.kakao && window.kakao.maps) return resolve();
    const s = document.createElement('script');
    s.async = true;
    s.src = KAKAO_SRC(key);
    s.onerror = () => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG_MAP') === '1') {
          // eslint-disable-next-line no-console
          console.error('[kakao] SDK 스크립트 로드 실패. 도메인 허용(http://localhost) 및 JS 키 확인');
        }
      } catch {}
      reject(new Error('Kakao SDK 로드 실패'));
    };
    s.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    document.head.appendChild(s);
  });
  return kakaoLoaded;
}

export type KakaoLatLng = { lat: number; lng: number };

export function createMap(container: HTMLDivElement, center: KakaoLatLng, level = 5) {
  const kakao = window.kakao;
  return new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(center.lat, center.lng),
    level,
  });
}

export function getServices(map?: any) {
  const kakao = window.kakao;
  const places = new kakao.maps.services.Places(map);
  const geocoder = new kakao.maps.services.Geocoder();
  return { places, geocoder };
}

/** 키워드 검색 */
export function searchKeyword(opts: {
  query: string;
  x?: number; y?: number; radius?: number; page?: number;
}): Promise<any[]> {
  const { places } = getServices();
  return new Promise((resolve, reject) => {
    const cb = (data: any, status: string) => {
      if (status === window.kakao.maps.services.Status.OK) resolve(data);
      else resolve([]); // NOT_FOUND 등을 빈배열로
    };
    if (opts.x && opts.y && opts.radius) {
      places.keywordSearch(opts.query, cb, {
        x: String(opts.x), y: String(opts.y), radius: opts.radius, page: opts.page ?? 1,
      });
    } else {
      places.keywordSearch(opts.query, cb, { page: opts.page ?? 1 });
    }
  });
}

/** 카테고리 검색 (예: CE7 카페, AT4 관광명소, CT1 문화시설) */
export function categorySearch(opts: {
  code: string; x: number; y: number; radius: number; page?: number;
}): Promise<any[]> {
  const { places } = getServices();
  return new Promise((resolve) => {
    places.categorySearch(
      opts.code,
      (data: any, status: string) => {
        if (status === window.kakao.maps.services.Status.OK) resolve(data);
        else resolve([]);
      },
      { x: String(opts.x), y: String(opts.y), radius: opts.radius, page: opts.page ?? 1 }
    );
  });
}

/** 주소 지오코딩 */
export function geocodeAddress(address: string): Promise<KakaoLatLng | null> {
  const { geocoder } = getServices();
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (res: any, status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !res?.[0]) return resolve(null);
      resolve({ lat: parseFloat(res[0].y), lng: parseFloat(res[0].x) });
    });
  });
}

/** 좌표 → 행정구역명 (시/도 등) */
export function reverseSido(ll: KakaoLatLng): Promise<string> {
  const { geocoder } = getServices();
  return new Promise((resolve) => {
    geocoder.coord2RegionCode(String(ll.lng), String(ll.lat), (res: any, status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !res?.[0]) return resolve('');
      // region_1depth_name: 시/도
      const sido = res.find((r: any) => r.region_type === 'H')?.region_1depth_name || res[0].region_1depth_name;
      resolve(sido || '');
    });
  });
}
