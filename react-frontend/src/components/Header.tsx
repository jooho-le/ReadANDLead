import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  FaHome,
  FaBook,
  FaMapMarkedAlt,
  FaBookOpen,
  FaImages,
  FaGlobeEurope,
  FaUserFriends,
  FaFolderOpen,
  FaSignInAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import type { IconType, IconBaseProps } from 'react-icons';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';

// ✅ 올바른 경로(components → api) : 한 단계만 올라가면 됩니다.
import { register, login, me } from '../api/auth';

const iconEl = (C: IconType) =>
  React.createElement(C as unknown as React.ComponentType<IconBaseProps>);

/* ===== styled components ===== */
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

/* 네이티브 앱(안드/아이폰)에서는 좌측 사이드 레일 레이아웃 */
const Rail = styled.aside`
  position: fixed;
  inset: 0 auto 0 0;
  width: 72px;
  background: #ffffffdd;
  backdrop-filter: blur(8px);
  border-right: 1px solid rgba(0,0,0,0.06);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  gap: 6px;
`;

const RailLogo = styled(Link)`
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px;
  color: #667eea; text-decoration: none; font-weight: 800;
  border: 1px solid #e9e9f5; background: #f7f8ff;
`;

const RailBtn = styled(Link)<{ $active?: boolean }>`
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: ${(p) => (p.$active ? '#667eea' : '#666')};
  background: ${(p) => (p.$active ? 'rgba(102,126,234,0.12)' : 'transparent')};
  border: 1px solid ${(p) => (p.$active ? '#ccd3ff' : 'transparent')};
  text-decoration: none;
`;

const RailSpacer = styled.div` flex: 1 1 auto; `;
const RailLogout = styled.button`
  width: 48px; height: 36px; border-radius: 10px;
  border: 1px solid #eee; background: #fff; color:#555; font-weight:700;
`;

const Nav = styled.nav`
  max-width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr auto; /* 좌측 로고 / 가운데 메뉴 / 우측 인증 */
  align-items: center;
  min-height: 80px;
  column-gap: 16px;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
`;

const Logo = styled(Link)`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 1.8rem;
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  &:hover {
    transform: scale(1.05);
    transition: transform 0.3s ease;
  }
  @media (max-width: 1695px) {
    display: none;
  }
  @media (max-width: 1480px) {
    display: inline-flex;
  }
  @media (max-width: 860px) {
    display: none;
  }
  
`;

const NavMenu = styled.ul`
  display: flex;
  gap: 24px;
  list-style: none;
  align-items: center;
  margin: 0;
  padding: 0;
  justify-self: center;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 8px;
    justify-content: center;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
`;


const NavItem = styled.li`
  position: relative;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
  color: ${(p) => (p.$active ? '#667eea' : '#666')};
  background: ${(p) => (p.$active ? 'rgba(102,126,234,0.1)' : 'transparent')};
  text-decoration: none;

  &:hover {
    color: #667eea;
    background: rgba(102,126,234,0.1);
    transform: translateY(-2px);
    border-bottom: 2px solid #555;
  }

  @media (max-width: 1480px) {
    padding: 10px;
    span {
      display: none; /* label 숨기기 */
    }
  }
`;


const AuthArea = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-self: end;  /* 우측 끝 고정 */
  //min-width: 160px;   /* 버튼이 줄바뀌어도 영역 확보 */
`;

const LoginBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #e5e7ff;
  background: #f5f6ff;
  color: #444;
  font-weight: 700;

  &:hover {
    background: #eef0ff;
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    span {
      display: none;
    }
  }
`;


const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 700;
  color: #fff;
  background: #667eea;
  border: none;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    span {
      display: none;
    }
  }
`;


const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const Modal = styled.div`
  width: 360px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  padding: 20px;
`;

const ModalTitle = styled.h3`
  margin: 0 0 12px;
`;

const Providers = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProviderBtn = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid #e5e5e5;
  background: #fff;
  &:hover {
    background: #f7f7ff;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 10px;
  margin-top: 20px;
`;

const Label = styled.label`
  display: grid;
  gap: 6px;
  font-weight: 600;
`;

const Input = styled.input`
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 10px 12px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  border: 1px solid ${(p) => (p.$primary ? '#667eea' : '#e5e5e5')};
  background: ${(p) => (p.$primary ? '#667eea' : '#fff')};
  color: ${(p) => (p.$primary ? '#fff' : '#333')};
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: #c00;
  font-size: 0.9rem;
`;

/* ===== small helpers ===== */
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  createPortal(children, document.body);

/* ===== component ===== */
type NavItemDef = { path: string; label: string; icon: () => React.ReactNode };
type Profile = { id: string; email: string; display_name?: string };

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );
  const [profile, setProfile] = useState<Profile | null>(null);

  // form state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // CRA / Vite 둘 다 대응 (경고는 무시 가능)
  const API_URL = useMemo(
    () =>
      (import.meta as any)?.env?.VITE_API_URL ||
      (process.env as any)?.REACT_APP_API_URL ||
      (typeof window !== 'undefined' ? (window as any).__API_BASE__ : '') ||
      '',
    []
  );

  // 토큰 있으면 내 정보 불러오기
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!token) {
        setProfile(null);
        return;
      }
      try {
        const p = await me();
        if (!ignore) {
          setProfile({
            id: String(p.id),
            email: p.email,
            display_name: p.display_name,
          });
        }
      } catch {
        if (!ignore) setProfile(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [token]);

  const navItems: NavItemDef[] = [
    { path: '/', label: '홈', icon: () => iconEl(FaHome) },
    { path: '/map', label: '책으로 장소찾기', icon: () => iconEl(FaBook) },
    { path: '/place-to-book', label: '장소로 책 찾기', icon: () => iconEl(FaMapMarkedAlt) },
    { path: '/diary', label: '여행 퀘스트북', icon: () => iconEl(FaBookOpen) },
    { path: '/four-cut', label: '인생네컷', icon: () => iconEl(FaImages) },
    { path: '/agency-trips', label: '관광사와 여행 떠나기', icon: () => iconEl(FaGlobeEurope) },
    // ✅ 정확히 복수형 경로
    { path: '/neighbors', label: '이웃의 책여행 따라가기', icon: () => iconEl(FaUserFriends) },
    { path: '/my', label: '마이페이지', icon: () => iconEl(FaFolderOpen) },
  ];

  const isNative = (() => {
    try {
      if ((Capacitor as any)?.isNativePlatform?.()) return true;
      const p = (Capacitor as any)?.getPlatform?.();
      return p === 'android' || p === 'ios';
    } catch { return false; }
  })();

  function doLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setProfile(null);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrMsg('');

    try {
      if (mode === 'register') {
        const t = await register({
          email: email.trim(),
          password,
          display_name: (displayName || email.split('@')[0]).trim(),
        });
        localStorage.setItem('token', t.access_token);
        setToken(t.access_token);
      } else {
        const t = await login({
          email: email.trim(),
          password,
        });
        localStorage.setItem('token', t.access_token);
        setToken(t.access_token);
      }

      // 프로필 동기화
      const p = await me();
      setProfile({ id: String(p.id), email: p.email, display_name: p.display_name });

      // 초기화 & 닫기
      setEmail('');
      setPassword('');
      setDisplayName('');
      setShowModal(false);

    } catch (e: any) {
      setErrMsg(e?.message || '요청 중 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  // 네이티브 앱이면 좌측 레일을 렌더링 (웹은 기존 헤더 유지)
  if (isNative) {
    return (
      <Rail>
        <RailLogo to="/">{iconEl(FaBook)}</RailLogo>
        {navItems.map((item) => (
          <RailBtn
            key={item.path}
            to={item.path}
            $active={location.pathname === item.path}
            title={item.label}
          >
            {item.icon()}
          </RailBtn>
        ))}
        <RailSpacer />
        {!profile ? (
          <RailBtn to="#" onClick={(e)=>{ e.preventDefault(); setMode('login'); setShowModal(true); }} title="로그인">
            {iconEl(FaSignInAlt)}
          </RailBtn>
        ) : (
          <RailLogout onClick={doLogout}>out</RailLogout>
        )}

        {showModal && (
          <Portal>
            <Backdrop onClick={() => setShowModal(false)}>
              <Modal onClick={(e) => e.stopPropagation()}>
                <ModalTitle>{mode === 'login' ? '로그인' : '회원가입'}</ModalTitle>
                <Row style={{ justifyContent: 'flex-start' }}>
                  <Button type="button" $primary={mode==='login'} onClick={()=>setMode('login')}>로그인</Button>
                  <Button type="button" $primary={mode==='register'} onClick={()=>setMode('register')}>가입하기</Button>
                </Row>
                <Form onSubmit={handleAuth}>
                  <Label>
                    이메일
                    <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="you@example.com" />
                  </Label>
                  {mode==='register' && (
                    <Label>
                      표시 이름(선택)
                      <Input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="프로필에 보일 이름" />
                    </Label>
                  )}
                  <Label>
                    비밀번호
                    <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="••••••••" />
                  </Label>
                  {errMsg && <ErrorText>{errMsg}</ErrorText>}
                  <Row>
                    <Button type="button" onClick={()=>setShowModal(false)}>취소</Button>
                    <Button type="submit" $primary disabled={submitting}>{submitting ? '처리중…' : (mode==='login' ? '로그인' : '가입하기')}</Button>
                  </Row>
                </Form>
              </Modal>
            </Backdrop>
          </Portal>
        )}
      </Rail>
    );
  }

  return (
    <HeaderContainer>
      <Nav>
        <Left>
          <Logo to="/">{iconEl(FaBook)} Read &amp; Lead</Logo>
          <NavMenu>
            {navItems.map((item) => (
              <NavItem key={item.path}>
                <NavLink to={item.path} $active={location.pathname === item.path}>
                  {item.icon()}
                  <span>{item.label}</span> {/* ← label만 감싸서 모바일에서 숨김 */}
                </NavLink>
              </NavItem>
            ))}
          </NavMenu>
                </Left>

        <AuthArea>
          {!profile ? (
              <LoginBtn
                  onClick={() => {
                    setMode('login');
                    setShowModal(true);
                  }}
              >
                {iconEl(FaSignInAlt)} <span>로그인</span>
              </LoginBtn>
          ) : (
            <>
              <div style={{ fontWeight: 700, color: '#555', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.display_name || profile.email}
              </div>
              <LogoutBtn onClick={doLogout}>
                {iconEl(FaSignOutAlt)} <span> 로그아웃 </span></LogoutBtn>
            </>
          )}
        </AuthArea>
      </Nav>

      {showModal && (
        <Portal>
          <Backdrop onClick={() => setShowModal(false)}>
            <Modal onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{mode === 'login' ? '로그인' : '회원가입'}</ModalTitle>

              <Row style={{ justifyContent: 'flex-start' }}>
                <Button
                  type="button"
                  $primary={mode === 'login'}
                  onClick={() => setMode('login')}
                >
                  로그인
                </Button>
                <Button
                  type="button"
                  $primary={mode === 'register'}
                  onClick={() => setMode('register')}
                >
                  가입하기
                </Button>
              </Row>

              <Form onSubmit={handleAuth}>
                <Label>
                  이메일
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </Label>

                {mode === 'register' && (
                  <Label>
                    표시 이름(선택)
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="프로필에 보일 이름"
                    />
                  </Label>
                )}

                <Label>
                  비밀번호
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </Label>

                {errMsg && <ErrorText>{errMsg}</ErrorText>}

                <Row>
                  <Button type="button" onClick={() => setShowModal(false)}>
                    취소
                  </Button>
                  <Button type="submit" $primary disabled={submitting}>
                    {submitting ? '처리중…' : mode === 'login' ? '로그인' : '가입하기'}
                  </Button>
                </Row>
              </Form>
            </Modal>
          </Backdrop>
        </Portal>
      )}
    </HeaderContainer>
  );
}
