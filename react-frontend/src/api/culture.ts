import API_BASE from './config';

export async function fetchCultureNearby(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
  from: string; // YYYYMMDD
  to: string;   // YYYYMMDD
  keyword?: string;
}) {
  const { lat, lng, radiusKm = 5, from, to, keyword = '' } = params;
  const url = `${API_BASE}/culture/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&date_from=${from}&date_to=${to}&keyword=${encodeURIComponent(keyword)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Culture API error');
  return res.json();
}
