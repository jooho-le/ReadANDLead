import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import FourCutCreator from './pages/FourCutCreator';
import LiteraryTripScrap from './pages/LiteraryTripScrap';

// 공통 헤더 (기존 파일)
import Header from './components/Header';

// pages
import Home from './pages/Home';
import LocationMap from './pages/LocationMap';
import TravelDiary from './pages/TravelDiary';
import OAuthPopupCallback from './pages/OAuthPopupCallback';
// ✅ BookSearch 제거
// import BookSearch from './pages/BookSearch';

const Main = styled.main`
  min-height: 100vh;
  background: #f8f9fb;
  padding-top: 80px; /* Header가 fixed라면 컨텐츠가 가리지 않게 */
`;

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* ✅ BookSearch 라우트 제거
          <Route path="/search" element={<BookSearch />} /> */}
          <Route path="/map" element={<LocationMap />} />
          <Route path="/diary" element={<TravelDiary />} />
          <Route path="/oauth/callback" element={<OAuthPopupCallback />} />
          <Route path="/four-cut" element={<FourCutCreator />} />
          <Route path="/literary-scrap" element={<LiteraryTripScrap />} />
          {/* 없는 경로는 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Main>
    </BrowserRouter>
  );
}
