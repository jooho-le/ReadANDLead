import { useEffect } from 'react';

export default function OAuthPopupCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      try {
        // 1) 동일 오리진 저장소에 먼저 기록 (부모가 바로 읽을 수 있음)
        localStorage.setItem('token', token);
        // storage 이벤트 트리거용으로 한 번 더 쓰기 (브라우저 따라 필요)
        localStorage.setItem('token_last_update', String(Date.now()));

        // 2) 가능하면 postMessage도 함께 전송
        if (window.opener) {
          window.opener.postMessage(
            { type: 'oauth:success', token },
            window.location.origin
          );
        }
      } finally {
        // 3) 약간의 지연 후 닫기 (메시지/스토리지 전파 시간 확보)
        setTimeout(() => window.close(), 100);
      }
    }
  }, []);

  return <div style={{ padding: 16 }}>로그인 처리 중...</div>;
}
