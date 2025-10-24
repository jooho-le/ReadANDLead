// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { Capacitor } from '@capacitor/core';

import Header from './components/Header';

import Home from './pages/Home';
import LocationMap from './pages/LocationMap';
import TravelDiary from './pages/TravelDiary';
import FourCutCreator from './pages/FourCutCreator';
import AgencyTrips from './pages/AgencyTrips';
import AgencyTripDetail from './pages/AgencyTripDetail';
import MyTrips from './pages/MyTrips';
import Neighbors from './pages/Neighbors';
import NeighborPostPage from './pages/NeighborPost';
import NeighborCompose from './pages/NeighborCompose';
import PlaceToBook from './pages/PlaceToBook';
import DiaryTripLayout, { PlanPanel, ItineraryPanel } from "./pages/DiaryTripPage";
import { apiFetch } from './api/config';
import { listNeighborSummaries } from './api/neighbor';
import { listAgencyTrips } from './api/agency';

const Main = styled.main<{ $native?: boolean }>`
  min-height: 100vh;
  background: #f8f9fb;

  /* 작은 화면에서만 헤더 여유 */
  /* (min 40px, pref 12vw, max 50px) */
  padding-top: ${(p) => (p.$native ? '0px' : 'clamp(40px, 12vw, 50px)')};

  /* 데스크탑 이상에서는 여백 제거 */
  @media (min-width: 1024px) {
    padding-top: ${(p) => (p.$native ? '0px' : '100px')};
  }

  /* 네이티브 앱일 때는 사이드 레일 폭만큼 여백을 줌 (compact 56px) */
  padding-left: ${(p) => (p.$native ? '56px' : '0px')};
`;

export default function App() {
  const isNative = (() => {
    try {
      // Capacitor 7: isNativePlatform(), getPlatform()
      if ((Capacitor as any)?.isNativePlatform?.()) return true;
      const p = (Capacitor as any)?.getPlatform?.();
      return p === 'android' || p === 'ios';
    } catch {
      return false;
    }
  })();
  // Prewarm API (non-blocking) to avoid cold-start hit on first interactive fetch
  useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();
    (async () => {
      try { await apiFetch('/api/ping', { signal: ctrl.signal }); } catch {}
      if (aborted) return;
    })();
    return () => { aborted = true; ctrl.abort(); };
  }, []);

  // Idle prefetch: warm client caches for public lists
  useEffect(() => {
    const ric = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 300));
    const cancel = (window as any).cancelIdleCallback || clearTimeout;
    const handle = ric(async () => {
      try { await Promise.allSettled([
        listNeighborSummaries(30),
        listAgencyTrips(),
      ]); } catch {}
    });
    return () => { cancel(handle); };
  }, []);
  return (
    <BrowserRouter>
      <Header />
      <Main $native={isNative}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<LocationMap />} />
          <Route path="/place-to-book" element={<PlaceToBook />} />
          <Route path="/diary" element={<TravelDiary />} />
          <Route path="/four-cut" element={<FourCutCreator />} />
          <Route path="/agency-trips" element={<AgencyTrips />} />
          <Route path="/agency-trips/:id" element={<AgencyTripDetail />} />
          <Route path="/my" element={<MyTrips />} />

          <Route path="/diary/trip/:id" element={<DiaryTripLayout />}>
            <Route path="plan" element={<PlanPanel />} />
            <Route path="itinerary" element={<ItineraryPanel />} />
          </Route>

          <Route path="/neighbors/new" element={<NeighborCompose />} />
          <Route path="/neighbors" element={<Neighbors />} />
          <Route path="/neighbors/:id" element={<NeighborPostPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Main>
    </BrowserRouter>
  );
}
