// CRA(react-scripts) 전용: import.meta 사용하지 말고 process.env만 사용
const API_BASE = process.env.REACT_APP_API_BASE || '';

export default API_BASE;

// 혹시 또 TS1208 뜨면 아래 한 줄을 남겨둬도 됩니다.
// export {};
