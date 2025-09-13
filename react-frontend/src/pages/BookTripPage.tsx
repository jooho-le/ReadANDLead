// src/pages/BookTripPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

type FormState = {
  title: string;
  startDate: string;
  endDate: string;
  people: string; // 입력은 문자열로 받고 제출 시 숫자 변환
  notes: string;
  themes: string[];
  themeCustom: string;
};

const ALL_THEMES = ["식도락", "문화및예술", "역사 공부", "기타"] as const;

export default function BookTripPage() {
  // URL에서 값 읽기
  const { id } = useParams(); // /book-trip/:id
  const [searchParams] = useSearchParams(); // ?title=...
  const titleFromQuery = useMemo(() => searchParams.get("title") || "", [searchParams]);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    title: "",
    startDate: "",
    endDate: "",
    people: "2",
    notes: "",
    themes: [],
    themeCustom: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 첫 렌더에 쿼리의 책 제목을 기본값으로 주입
  useEffect(() => {
    if (titleFromQuery && !form.title) {
      setForm((prev) => ({ ...prev, title: `${titleFromQuery} 여행` }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleFromQuery]);

  const toggleTheme = (theme: string) => {
    setForm((prev) => {
      const s = new Set(prev.themes);
      if (s.has(theme)) s.delete(theme);
      else s.add(theme);
      return { ...prev, themes: Array.from(s) };
    });
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "여행 제목을 입력해주세요.";
    if (!form.startDate) return "시작일을 선택해주세요.";
    if (!form.endDate) return "종료일을 선택해주세요.";
    if (form.endDate < form.startDate) return "종료일은 시작일 이후여야 합니다.";
    const peopleNum = Number(form.people);
    if (!Number.isInteger(peopleNum) || peopleNum < 1 || peopleNum > 50) {
      return "인원은 1~50 사이 정수여야 합니다.";
    }
    if (form.themes.length === 0) return "테마를 1개 이상 선택해주세요.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitting(true);
    try {
      const themes =
        form.themeCustom.trim() && form.themes.includes("기타")
          ? [...form.themes.filter((t) => t !== "기타"), form.themeCustom.trim()]
          : form.themes;

      // 책제목을 별도 필드로도 전달(서버에서 참고 가능)
      const payload = {
        tripId: id, // 선택: 서버 저장 시 식별용
        sourceBookTitle: titleFromQuery, // 선택: 책 제목 원문
        title: form.title.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        people: Number(form.people),
        notes: form.notes.trim(),
        themes,
      };

      const res = await fetch("/api/travel/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const plan = await res.json();

      console.log("여행 계획 생성 결과:", plan);
      // 성공 후 /book-trip/trip/:id 로 이동
      // (선택) 새로고침 대비 백업
      if (id) sessionStorage.setItem(`travel-plan:${id}`, JSON.stringify({ plan }));

      //  상세 페이지로 이동
      navigate(`/book-trip/trip/${id}`, { state: { plan } });
    } catch (err: any) {
      setError(err?.message || "생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>여행 만들기</h1>

      {/* 참고 표시 (선택) */}
      <div style={{ marginBottom: 12, color: "#6b7280" }}>
        트립 ID: <b>{id}</b>{titleFromQuery ? <> / 책 제목: <b>{titleFromQuery}</b></> : null}
      </div>

      <form onSubmit={onSubmit}>
        {/* 여행 제목 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6 }}>여행 제목</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예) 『흰』을 따라가는 전주 여행"
            style={inputStyle}
          />
        </div>

        {/* 일정 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>시작일</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>종료일</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* 인원 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6 }}>인원</label>
          <input
            type="number"
            min={1}
            max={50}
            value={form.people}
            onChange={(e) => setForm({ ...form, people: e.target.value })}
            style={inputStyle}
          />
        </div>

        {/* 특이사항 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6 }}>기타 특이사항</label>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="예) 휠체어 접근 가능 장소 선호"
            style={textareaStyle}
          />
        </div>

        {/* 테마 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>테마 선택 (복수 선택 가능)</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ALL_THEMES.map((t) => (
              <label
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.themes.includes(t)}
                  onChange={() => toggleTheme(t)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>

          {form.themes.includes("기타") && (
            <input
              placeholder="기타 테마 입력"
              value={form.themeCustom}
              onChange={(e) => setForm({ ...form, themeCustom: e.target.value })}
              style={{ ...inputStyle, marginTop: 8 }}
            />
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div style={{ color: "#b00020", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* 제출 */}
        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? "생성 중..." : "계획 생성하기"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 10px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "black",
  color: "white",
  cursor: "pointer",
};
