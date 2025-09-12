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
import AgencyTrips from './pages/AgencyTrips';
import AgencyTripDetail from './pages/AgencyTripDetail';

// 이웃의 책여행
import Neighbors from './pages/Neighbors';
import NeighborPostPage from './pages/NeighborPost';
import NeighborCompose from './pages/NeighborCompose';
import PlaceToBook from './pages/PlaceToBook';

const Main = styled.main`
  min-height: 100vh;
  background: #f8f9fb;
  padding-top: calc(80px + env(safe-area-inset-top, 0px)); /* Header + 안전영역 */
  @media (max-width: 768px) {
    padding-top: calc(56px + env(safe-area-inset-top, 0px));
  }
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
          <Route path="/agency-trips" element={<AgencyTrips />} />
          <Route path="/agency-trips/:id" element={<AgencyTripDetail />} />
          <Route path="/four-cut" element={<FourCutCreator />} />

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
