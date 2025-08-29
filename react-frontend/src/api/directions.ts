import { ENDPOINTS } from './config';

export type LatLng = { lat: number; lng: number };

export async function fetchDrivingRoute(params: {
  origin: LatLng;
  destination: LatLng;
  priority?: 'RECOMMEND'|'TIME'|'DISTANCE';
}): Promise<{ path: LatLng[]; distance: number|null; duration: number|null }> {
  const qs = new URLSearchParams({
    originLat: String(params.origin.lat),
    originLng: String(params.origin.lng),
    destLat: String(params.destination.lat),
    destLng: String(params.destination.lng),
  });
  if (params.priority) qs.set('priority', params.priority);

  const r = await fetch(`${ENDPOINTS.routeDriving}?${qs.toString()}`, { credentials: 'include' });
  if (!r.ok) throw new Error('route http ' + r.status);
  return r.json();
}
