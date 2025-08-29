const API_BASE = process.env.REACT_APP_API_BASE || "";

export async function fetchLibrarianPicks({ startDate, endDate, drCode = 11, start = 1, end = 20 }) {
  const url = `${API_BASE}/library/recommendations?start_date=${startDate}&end_date=${endDate}&dr_code=${drCode}&start=${start}&end=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("NLK API error");
  return res.json();
}
