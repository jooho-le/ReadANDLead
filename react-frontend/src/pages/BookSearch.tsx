import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { FaSearch, FaMapMarkedAlt, FaBook, FaCalendarAlt } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';
import axios from 'axios';

const SearchContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SearchSection = styled.section`
  background: white;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const SearchTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 16px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 50px;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const SearchButton = styled.button`
  padding: 16px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultsSection = styled.section`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const ResultCard = styled.div`
  border: 1px solid #e1e5e9;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const BookTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
`;

const LocationInfo = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
`;

const LocationTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EventDescription = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const TourSitesSection = styled.div`
  margin-top: 20px;
`;

const TourSitesTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TourSiteCard = styled.div`
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const TourSiteName = styled.h5`
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
`;

const TourSiteAddress = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 4px;
`;

const TourSiteTel = styled.p`
  color: #667eea;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  color: #667eea;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #e74c3c;
  background: #fdf2f2;
  border-radius: 12px;
  border: 1px solid #fecaca;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

// API 함수
const searchBook = async (bookTitle: string) => {
  const response = await axios.get(`http://localhost:8000/search_book?book_title=${encodeURIComponent(bookTitle)}`);
  return response.data;
};

const BookSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResult, isLoading, error, refetch } = useQuery({
    queryKey: ['bookSearch', searchTerm],
    queryFn: () => searchBook(searchTerm),
    enabled: false, // 자동 실행 비활성화
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SearchContainer>
      <Container>
        <SearchSection>
          <SearchTitle>도서 기반 여행 추천</SearchTitle>
          <SearchForm onSubmit={handleSearch}>
            <SearchInput
              type="text"
              placeholder="도서 제목을 입력하세요 (예: 동백꽃 필 무렵)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchButton type="submit" disabled={isSearching || !searchTerm.trim()}>
              {React.createElement(FaSearch as React.ComponentType<IconBaseProps>)}
              {isSearching ? '검색 중...' : '검색'}
            </SearchButton>
          </SearchForm>
        </SearchSection>

        {isLoading && (
          <ResultsSection>
            <LoadingSpinner>검색 중입니다...</LoadingSpinner>
          </ResultsSection>
        )}

        {error && (
          <ResultsSection>
            <ErrorMessage>
              검색 중 오류가 발생했습니다. 다시 시도해주세요.
            </ErrorMessage>
          </ResultsSection>
        )}

        {searchResult && (
          <ResultsSection>
            <ResultCard>
              <BookTitle>
                {React.createElement(FaBook as React.ComponentType<IconBaseProps>, { style: { marginRight: '8px', color: '#667eea' } })}
                {searchResult.book}
              </BookTitle>
              
              {searchResult.location ? (
                <LocationInfo>
                  <LocationTitle>
                    {React.createElement(FaMapMarkedAlt as React.ComponentType<IconBaseProps>)}
                    관련 장소: {searchResult.location}
                  </LocationTitle>
                  {searchResult.event && (
                    <EventDescription>{searchResult.event}</EventDescription>
                  )}
                </LocationInfo>
              ) : (
                <NoResults>
                  <p>이 도서와 관련된 여행지 정보를 찾을 수 없습니다.</p>
                  <p>다른 도서를 검색해보세요!</p>
                </NoResults>
              )}

              {searchResult.tour_sites && searchResult.tour_sites.length > 0 && (
                <TourSitesSection>
                  <TourSitesTitle>
                    {React.createElement(FaCalendarAlt as React.ComponentType<IconBaseProps>)}
                    주변 관광지 추천
                  </TourSitesTitle>
                  {searchResult.tour_sites.map((site: any, index: number) => (
                    <TourSiteCard key={index}>
                      <TourSiteName>{site.title || site.name}</TourSiteName>
                      {site.addr1 && (
                        <TourSiteAddress>📍 {site.addr1}</TourSiteAddress>
                      )}
                      {site.tel && (
                        <TourSiteTel>📞 {site.tel}</TourSiteTel>
                      )}
                    </TourSiteCard>
                  ))}
                </TourSitesSection>
              )}
            </ResultCard>
          </ResultsSection>
        )}
      </Container>
    </SearchContainer>
  );
};

export default BookSearch; 