import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled from 'styled-components';
import Header from './components/Header';
import Home from './pages/Home';
import BookSearch from './pages/BookSearch';
import LocationMap from './pages/LocationMap';
import TravelDiary from './pages/TravelDiary';
import CulturalEvents from './pages/CulturalEvents';
import GlobalStyle from './styles/GlobalStyle';

const queryClient = new QueryClient();

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
              <Route path="/events" element={<CulturalEvents />} />
            </Routes>
          </MainContent>
        </AppContainer>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
