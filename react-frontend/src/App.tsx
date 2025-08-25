// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled from 'styled-components';

import GlobalStyle from './styles/GlobalStyle';
import Header from './components/Header';

// pages
import Home from './pages/Home';
import BookSearch from './pages/BookSearch';
import LocationMap from './pages/LocationMap';
import TravelDiary from './pages/TravelDiary';
import OAuthPopupCallback from './pages/OAuthPopupCallback';
import DiaryTripLayout, { PlanPanel, JournalPanel, ItineraryPanel } from './pages/DiaryTripPage';
import FourCutCreator from './pages/FourCutCreator';
import LiteraryTripScrap from './pages/LiteraryTripScrap';

const queryClient = new QueryClient();

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

const MainContent = styled.main`
  padding-top: 80px;
  min-height: calc(100vh - 80px);
`;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyle />
      <Router>
        <AppContainer>
          <Header />
          <MainContent>
            <Routes>
              {/* 기본 라우트들 */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<BookSearch />} />
              <Route path="/map" element={<LocationMap />} />
              <Route path="/diary" element={<TravelDiary />} /> // 여행일기
              <Route path="/auth/popup-callback" element={<OAuthPopupCallback />} />

              {/* 새 기능 */}
              <Route path="/four-cut" element={<FourCutCreator />} />
              <Route path="/literary-scrap" element={<LiteraryTripScrap />} />

              {/* 여행 계획 */}
              {/* /diary/trip/:id 하위 탭 */}
              <Route path="/diary/trip/:id" element={<DiaryTripLayout />}>
                <Route index element={<Navigate to="plan" replace />} />
                <Route path="plan" element={<PlanPanel />} />
                <Route path="itinerary" element={<ItineraryPanel />} />
                <Route path="journal" element={<JournalPanel />} />
              </Route>

              {/* 나머지 → 홈으로 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainContent>
        </AppContainer>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
