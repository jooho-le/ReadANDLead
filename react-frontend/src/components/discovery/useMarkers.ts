import { useRef } from 'react';

type MarkerKind = 'performance' | 'exhibition' | 'museum' | 'cafe' | 'hot';

export function useMarkers() {
  const markersRef = useRef<Record<MarkerKind, google.maps.Marker[]>>({
    performance: [],
    exhibition: [],
    museum: [],
    cafe: [],
    hot: [],
  } as any);

  function clearMarkers(kind: MarkerKind) {
    (markersRef.current[kind] || []).forEach(m => m.setMap(null));
    markersRef.current[kind] = [];
  }
  function pushMarker(kind: MarkerKind, marker: google.maps.Marker) {
    markersRef.current[kind] = markersRef.current[kind] || [];
    markersRef.current[kind].push(marker);
  }
  function clearAll() {
    (Object.keys(markersRef.current) as MarkerKind[]).forEach(k => clearMarkers(k));
  }
  return { markersRef, clearMarkers, pushMarker, clearAll };
}
