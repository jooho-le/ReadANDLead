import { useRef } from 'react';

type Kind = 'performance' | 'exhibition' | 'museum' | 'cafe' | 'hot';

export function useKakaoMarkers() {
  const groups = useRef<Record<Kind, any[]>>({
    performance: [], exhibition: [], museum: [], cafe: [], hot: [],
  });

  function pushMarker(kind: Kind, marker: any) {
    groups.current[kind].push(marker);
  }
  function clearMarkers(kind?: Kind) {
    const kakao = (window as any).kakao;
    const kinds: Kind[] = kind ? [kind] : ['performance','exhibition','museum','cafe','hot'];
    kinds.forEach(k => {
      groups.current[k].forEach(m => m.setMap(null));
      groups.current[k] = [];
    });
  }
  return { pushMarker, clearMarkers };
}
