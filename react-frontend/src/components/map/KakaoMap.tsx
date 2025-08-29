import React, { useEffect, useRef, useState } from 'react';
import { createMap, loadKakaoSdk } from '../../api/kakao';

type Props = {
  center: { lat: number; lng: number };
  level?: number;
  className?: string;
  onReady?: (map: any) => void;
};

const KakaoMap: React.FC<Props> = ({ center, level = 5, className, onReady }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    (async () => {
      await loadKakaoSdk();
      if (!ref.current) return;
      const m = createMap(ref.current, center, level);
      setMap(m);
      onReady?.(m);
    })();
  }, []);

  // center 변경 시 패닝
  useEffect(() => {
    if (!map) return;
    const kakao = window.kakao;
    map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
  }, [center, map]);

  return <div ref={ref} className={className} style={{ width: '100%', height: '100%' }} />;
};

export default KakaoMap;
