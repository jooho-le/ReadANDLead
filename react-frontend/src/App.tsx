// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';

import Header from './components/Header';

// 기존 페이지들
import Home from './pages/Home';
import LocationMap from './pages/LocationMap';
import TravelDiary from './pages/TravelDiary';
import FourCutCreator from './pages/FourCutCreator';
import LiteraryTripScrap from './pages/LiteraryTripScrap';

// 이웃의 책여행
import Neighbors from './pages/Neighbors';
import NeighborPostPage from './pages/NeighborPost';
import NeighborCompose from './pages/NeighborCompose';
import PlaceToBook from './pages/PlaceToBook';

// 여행 일기 상세
import DiaryTripLayout, { PlanPanel, ItineraryPanel, JournalPanel } from "./pages/DiaryTripPage";

const Main = styled.main`
  min-height: 100vh;
  background: #f8f9fb;
  padding-top: 80px; /* Header가 fixed면 내용 가림 방지 */
`;

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<LocationMap />} />
          <Route path="/place-to-book" element={<PlaceToBook />} />
          <Route path="/diary" element={<TravelDiary />} />
          <Route path="/four-cut" element={<FourCutCreator />} />
          <Route path="/literary-scrap" element={<LiteraryTripScrap />} />

          {/* ✅ 여행 일기 상세 (중첩 라우트) */}
          <Route path="/diary/trip/:id" element={<DiaryTripLayout />}>
            <Route path="plan" element={<PlanPanel />} />
            <Route path="itinerary" element={<ItineraryPanel />} />
            <Route path="journal" element={<JournalPanel />} />
          </Route>

          {/* ✅ 'new'는 :id보다 먼저 선언해야 함 */}
          <Route path="/neighbors/new" element={<NeighborCompose />} />
          <Route path="/neighbors" element={<Neighbors />} />
          <Route path="/neighbors/:id" element={<NeighborPostPage />} />

          {/* 없는 경로는 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Main>
    </BrowserRouter>
  );
}
