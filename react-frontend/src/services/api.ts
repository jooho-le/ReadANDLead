const BASE = process.env.REACT_APP_API_BASE_URL || "";

export type Quote = {
  id: string;
  text: string;
  bookTitle?: string;
  author?: string;
};

export type PhotoMeta = {
  id: string;
  url: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  takenAt?: string;
};

export async function fetchRecommendedQuotes(params?: {
  locationName?: string;
  mood?: string;
}): Promise<Quote[]> {
  // TODO: 실제 API 연동
  return [
    { id: "q1", text: "여행이란 결국 자신을 찾는 길이다.", bookTitle: "어떤 여행기", author: "홍길동" },
    { id: "q2", text: "풍경은 기억 속에서 더 선명해진다.", bookTitle: "바람의 기록", author: "김바람" },
  ];
}

export async function fetchUserPhotos(): Promise<PhotoMeta[]> {
  return [];
}

export async function saveScrapItem(item: {
  photoUrl: string;
  quoteText?: string;
  comment?: string;
  locationName?: string;
  bookTitle?: string;
  author?: string;
  hashtags?: string[];
  createdAt?: string;
}) {
  // TODO: POST `${BASE}/scraps`
  return { ok: true };
}
