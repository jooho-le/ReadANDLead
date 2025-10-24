import { useRef } from 'react';

type Kind = 'performance' | 'exhibition' | 'tour' | 'museum' | 'cafe' | 'hot' | 'draft';

export function useKakaoMarkers() {
  const groups = useRef<Record<Kind, any[]>>({
    performance: [], exhibition: [], tour: [], museum: [], cafe: [], hot: [], draft: [],
  });

  function pushMarker(kind: Kind, marker: any) {
    groups.current[kind].push(marker);
  }
  function clearMarkers(kind?: Kind) {
    const kakao = (window as any).kakao;
    const kinds: Kind[] = kind ? [kind] : ['performance','exhibition','tour','museum','cafe','hot','draft'];
    kinds.forEach(k => {
      groups.current[k].forEach(m => m.setMap(null));
      groups.current[k] = [];
    });
  }
  function clearCategoryMarkers() {
    (['performance','exhibition','tour','museum','cafe','hot'] as Kind[]).forEach(k => clearMarkers(k));
  }
  return { pushMarker, clearMarkers, clearCategoryMarkers };
}
