
let gLoaded: Promise<void> | null = null;

export async function loadGooglePlaces() {
  if (gLoaded) return gLoaded;
  const key = process.env.REACT_APP_GOOGLE_MAPS_KEY;
  if (!key) throw new Error('REACT_APP_GOOGLE_MAPS_KEY 가 .env.local 에 필요합니다');
  const src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=ko`;
  gLoaded = new Promise<void>((resolve, reject) => {
    if ((window as any).google?.maps?.places) return resolve();
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google Places 스크립트 로드 실패'));
    document.head.appendChild(s);
  });
  return gLoaded;
}

function service(): any {
  // 지도 없이도 동작하도록 dummy div 사용
  return new (window as any).google.maps.places.PlacesService(document.createElement('div'));
}

export async function searchPlaceByText(query: string) {
  await loadGooglePlaces();
  const p = new Promise<any|null>((resolve) => {
    try {
      service().textSearch({ query }, (results: any, status: string) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results?.length) {
          resolve(results[0]);
        } else resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
  // 안전 타임아웃(1.5s): 구글 키/권한 문제 등으로 콜백이 지연될 때 UI가 멈추지 않게 함
  return Promise.race([
    p,
    new Promise<null>((res) => setTimeout(() => res(null), 1500)),
  ]);
}

export async function getPlaceDetails(placeId: string) {
  await loadGooglePlaces();
  return new Promise<any>((resolve, reject) => {
    service().getDetails(
      {
        placeId,
        fields: [
          'place_id','name','formatted_address','formatted_phone_number','international_phone_number',
          'website','rating','user_ratings_total','opening_hours','photos','geometry','url'
        ],
      },
      (res: any, status: string) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && res) resolve(res);
        else reject(new Error('getDetails 실패'));
      }
    );
  });
}

export function extractPhotoUrls(placeDetail: any, max = 6): string[] {
  const photos = placeDetail?.photos || [];
  return photos.slice(0, max).map((p: any) => p.getUrl({ maxWidth: 800, maxHeight: 800 }));
}
