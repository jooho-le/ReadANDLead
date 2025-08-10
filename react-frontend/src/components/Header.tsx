// src/components/Header.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaBook, FaSearch, FaMapMarkedAlt, FaBookOpen, FaCalendarAlt, FaSignInAlt } from 'react-icons/fa';
import type { IconBaseProps } from 'react-icons';
import { createPortal } from 'react-dom';

const HeaderContainer = styled.header`
  position: fixed; top: 0; left: 0; right: 0;
  background: rgba(255,255,255,.95); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,.2);
  z-index: 1000; padding: 0 20px;
`;
const Nav = styled.nav`
  max-width: 1200px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
  height: 80px;
`;
const Left = styled.div` display:flex; align-items:center; gap:32px; `;
const Logo = styled(Link)`
  font-size: 1.8rem; font-weight: 700;
  background: linear-gradient(135deg,#667eea 0%,#764ba2 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  display:flex; align-items:center; gap:8px;
  &:hover { transform: scale(1.05); transition: .3s; }
`;
const NavMenu = styled.ul` display:flex; gap:32px; align-items:center; `;
const NavItem = styled.li` position: relative; `;
const NavLink = styled(Link)<{ $active: boolean }>`
  display:flex; align-items:center; gap:8px; padding:12px 16px;
  border-radius:8px; font-weight:600; transition:.3s;
  color:${p=>p.$active?'#667eea':'#666'};
  background:${p=>p.$active?'rgba(102,126,234,.1)':'transparent'};
  &:hover { color:#667eea; background:rgba(102,126,234,.1); transform: translateY(-2px); }
`;

const AuthArea = styled.div` display:flex; gap:8px; align-items:center; `;
const LoginBtn = styled.button`
  display:flex; align-items:center; gap:8px;
  padding:10px 14px; border-radius:10px; cursor:pointer;
  border:1px solid #e5e7ff; background:#f5f6ff; color:#444; font-weight:700;
  &:hover { background:#eef0ff; }
`;
const LogoutBtn = styled.button`
  padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:700;
  color:#fff; background:#667eea; border:none; &:hover{ opacity:.9; }
`;

const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display:flex; align-items:center; justify-content:center; z-index:1100;
`;
const Modal = styled.div`
  width:360px; background:#fff; border-radius:16px; box-shadow:0 20px 40px rgba(0,0,0,.12);
  padding:20px;
`;
const ModalTitle = styled.h3` margin:0 0 12px; `;
const Providers = styled.div` display:flex; flex-direction:column; gap:10px; `;
const ProviderBtn = styled.button`
  width:100%; padding:12px; border-radius:10px; font-weight:700; cursor:pointer;
  border:1px solid #e5e5e5; background:#fff; &:hover{ background:#f7f7ff; }
`;

function centerPopup(url: string, name: string, w = 480, h = 680) {
  const y = window.top?.outerHeight ? Math.max(0, (window.top.outerHeight - h) / 2) : 100;
  const x = window.top?.outerWidth ? Math.max(0, (window.top.outerWidth - w) / 2) : 100;
  return window.open(url, name, `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=yes,status=no`);
}

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return createPortal(children, document.body);
};

export default function Header() {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // CRA/Vite 둘 다 대응
  // @ts-ignore
  const API_URL = useMemo(() => process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000', []);
  const FRONT_ORIGIN = useMemo(() => window.location.origin, []);

  // 팝업 열릴 때 바디 스크롤 잠그기 (컴포넌트 내부!)
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  // postMessage 수신
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== FRONT_ORIGIN) return;
      if (e.data?.type === 'oauth:success' && e.data?.token) {
        localStorage.setItem('token', e.data.token);
        setToken(e.data.token);
        setShowModal(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [FRONT_ORIGIN]);

  // storage/focus까지 같이 듣기(유실 방지)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue) {
        setToken(e.newValue);
        setShowModal(false);
      }
      if (e.key === 'token_last_update') {
        const t = localStorage.getItem('token');
        if (t) { setToken(t); setShowModal(false); }
      }
    };
    const onFocus = () => {
      const t = localStorage.getItem('token');
      if (t) { setToken(t); setShowModal(false); }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const startLogin = (p: 'google'|'naver'|'kakao') =>
    centerPopup(`${API_URL}/auth/${p}`, `oauth-${p}`);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

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
        <Left>
          <Logo to="/">{React.createElement(FaBook as React.ComponentType<IconBaseProps>)}Read & Lead</Logo>
          <NavMenu>
            {navItems.map((item) => (
              <NavItem key={item.path}>
                <NavLink to={item.path} $active={location.pathname === item.path}>
                  {React.createElement(item.icon as React.ComponentType<IconBaseProps>)}
                  {item.label}
                </NavLink>
              </NavItem>
            ))}
          </NavMenu>
        </Left>

        <AuthArea>
          {!token ? (
            <LoginBtn onClick={() => setShowModal(true)}>
              {React.createElement(FaSignInAlt as React.ComponentType<IconBaseProps>)} 로그인
            </LoginBtn>
          ) : (
            <LogoutBtn onClick={handleLogout}>로그아웃</LogoutBtn>
          )}
        </AuthArea>
      </Nav>

      {showModal && (
        <Portal>
          <Backdrop onClick={() => setShowModal(false)}>
            <Modal onClick={(e) => e.stopPropagation()}>
              <ModalTitle>로그인 방법 선택</ModalTitle>
              <Providers>
                <ProviderBtn onClick={() => startLogin('google')}>Google로 로그인</ProviderBtn>
                <ProviderBtn onClick={() => startLogin('naver')}>Naver로 로그인</ProviderBtn>
                <ProviderBtn onClick={() => startLogin('kakao')}>Kakao로 로그인</ProviderBtn>
              </Providers>
            </Modal>
          </Backdrop>
        </Portal>
      )}

    </HeaderContainer>
  );
}
