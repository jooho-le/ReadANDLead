import API_BASE from './config';

export async function fetchKopisPerformances(params: {
  city: string;
  from: string; // YYYYMMDD
  to: string;   // YYYYMMDD
  rows?: number;
  page?: number;
}) {
  const { city, from, to, rows = 30, page = 1 } = params;
  const url = `${API_BASE}/kopis/search?city=${encodeURIComponent(city)}&date_from=${from}&date_to=${to}&rows=${rows}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('KOPIS API error');
  return res.json();
}
