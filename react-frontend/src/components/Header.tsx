import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaBook, FaSearch, FaMapMarkedAlt, FaBookOpen, FaCalendarAlt } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  padding: 0 20px;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: scale(1.05);
    transition: transform 0.3s ease;
  }
`;

const NavMenu = styled.ul`
  display: flex;
  gap: 32px;
  align-items: center;
`;

const NavItem = styled.li`
  position: relative;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  color: ${props => props.$active ? '#667eea' : '#666'};
  background: ${props => props.$active ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
  
  &:hover {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
  }
`;

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '홈', icon: FaBook },
    { path: '/search', label: '도서 검색', icon: FaSearch },
    { path: '/map', label: '지도', icon: FaMapMarkedAlt },
    { path: '/diary', label: '여행일기', icon: FaBookOpen },
    { path: '/events', label: '문화행사', icon: FaCalendarAlt },
  ];

  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">
          {React.createElement(FaBook as React.ComponentType<IconBaseProps>)}
          Read & Lead
        </Logo>
        <NavMenu>
          {navItems.map((item) => {
            return (
              <NavItem key={item.path}>
                <NavLink to={item.path} $active={location.pathname === item.path}>
                  {React.createElement(item.icon as React.ComponentType<IconBaseProps>)}
                  {item.label}
                </NavLink>
              </NavItem>
            );
          })}
        </NavMenu>
      </Nav>
    </HeaderContainer>
  );
};

export default Header; 