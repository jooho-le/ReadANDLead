export default function LoginButtons() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  return (
    <div>
      <a href={`${API_URL}/auth/google`}>구글 로그인</a>
      <a href={`${API_URL}/auth/naver`}>네이버 로그인</a>
      <a href={`${API_URL}/auth/kakao`}>카카오 로그인</a>
    </div>
  );
}
