import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled from 'styled-components';
import OAuthPopupCallback from './pages/OAuthPopupCallback';
import Header from './components/Header';
import Home from './pages/Home';
import BookSearch from './pages/BookSearch';
import LocationMap from './pages/LocationMap';
import TravelDiary from './pages/TravelDiary';
import CulturalEvents from './pages/CulturalEvents';
import GlobalStyle from './styles/GlobalStyle';

// ⬇️ 추가 페이지
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
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<BookSearch />} />
              <Route path="/map" element={<LocationMap />} />
              <Route path="/diary" element={<TravelDiary />} />
              <Route path="/auth/popup-callback" element={<OAuthPopupCallback />} />
              
              {/* ⬇️ 새 라우트 */}
              <Route path="/four-cut" element={<FourCutCreator />} />
              <Route path="/literary-scrap" element={<LiteraryTripScrap />} />
            </Routes>
          </MainContent>
        </AppContainer>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
