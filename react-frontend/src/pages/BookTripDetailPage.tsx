import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

type DayPlan = {
  date: string;              // "2025-09-10"
  themeFocus: string;        // 예: "식도락"
  morning: string;
  afternoon: string;
  evening: string;
  foodSuggestions?: string[];
  notes?: string;
};

type TravelPlan = {
  planTitle: string;
  summary?: string;
  days: DayPlan[];
  packingTips?: string[];
  cautions?: string[];
};

export default function BookTripDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  // BookTripPage에서 navigate(..., { state: { plan } }) 로 전달한 데이터
  const plan = (location.state as { plan?: TravelPlan })?.plan;

  // (선택) 혹시 새로고침 등으로 state가 날아간 경우 대비해서 sessionStorage fallback
  const data: TravelPlan | null = useMemo(() => {
    if (plan) return plan;
    try {
      const raw = sessionStorage.getItem(`travel-plan:${id}`);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      // obj = { input, plan }
      return obj?.plan ?? null;
    } catch {
      return null;
    }
  }, [plan, id]);

  const formatDate = (iso: string) => {
    // "YYYY-MM-DD" → "YYYY. MM. DD."
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map((v) => Number(v));
    if (!y || !m || !d) return iso;
    return `${y}. ${String(m).padStart(2, "0")}. ${String(d).padStart(2, "0")}.`;
  };

  if (!data) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>여행 상세</h1>
        <p style={{ color: "#6b7280" }}>
          계획 데이터를 찾을 수 없어요. 생성 페이지에서 다시 만들어 주세요.
        </p>
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => nav(-1)}
            style={{ padding: "10px 14px", borderRadius: 8, background: "black", color: "white", border: "none" }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
    }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>{data.planTitle}</h1>
          <div style={{ color: "#6b7280", marginTop: 4 }}>Trip ID: <b>{id}</b></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}
          >
            인쇄/저장(PDF)
          </button>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${data.planTitle || "travel-plan"}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}
          >
            JSON 내보내기
          </button>
        </div>
      </div>

      {/* 요약 */}
      {data.summary && (
        <section style={{ marginTop: 16, marginBottom: 20, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>요약</h2>
          <p style={{ lineHeight: 1.6 }}>{data.summary}</p>
        </section>
      )}

      {/* 본문 그리드: 왼쪽 일정, 오른쪽 팁 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* 일정 타임라인 */}
        <section>
          {data.days?.map((d, idx) => (
            <article
              key={idx}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                background: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  Day {idx + 1} · {formatDate(d.date)}
                </h3>
                {d.themeFocus && (
                  <span
                    style={{
                      fontSize: 12,
                      background: "#eef2ff",
                      color: "#4338ca",
                      padding: "4px 8px",
                      borderRadius: 9999,
                      border: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.themeFocus}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={block}>
                  <h4 style={blockTitle}>오전</h4>
                  <p style={blockText}>{d.morning}</p>
                </div>
                <div style={block}>
                  <h4 style={blockTitle}>오후</h4>
                  <p style={blockText}>{d.afternoon}</p>
                </div>
                <div style={block}>
                  <h4 style={blockTitle}>저녁</h4>
                  <p style={blockText}>{d.evening}</p>
                </div>

                {d.foodSuggestions && d.foodSuggestions.length > 0 && (
                  <div style={blockFull}>
                    <h4 style={blockTitle}>식도락 추천</h4>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {d.foodSuggestions.map((f, i) => (
                        <li key={i} style={{ lineHeight: 1.6 }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {d.notes && (
                  <div style={blockFull}>
                    <h4 style={blockTitle}>메모</h4>
                    <p style={blockText}>{d.notes}</p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* 팁 / 주의사항 사이드 */}
        <aside>
          {data.packingTips && data.packingTips.length > 0 && (
            <div style={{ ...sideCard, marginBottom: 12 }}>
              <h3 style={sideTitle}>준비물 팁</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.packingTips.map((t, i) => (
                  <li key={i} style={{ lineHeight: 1.6 }}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {data.cautions && data.cautions.length > 0 && (
            <div style={{ ...sideCard, borderColor: "#fee2e2", background: "#fff1f2" }}>
              <h3 style={{ ...sideTitle, color: "#b91c1c" }}>주의사항</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.cautions.map((c, i) => (
                  <li key={i} style={{ lineHeight: 1.6 }}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const block: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  background: "#f9fafb",
};

const blockFull: React.CSSProperties = {
  ...block,
  gridColumn: "1 / -1",
};

const blockTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 6,
};

const blockText: React.CSSProperties = { margin: 0, lineHeight: 1.6 };

const sideCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  background: "#fff",
};

const sideTitle: React.CSSProperties = { margin: 0, marginBottom: 8, fontWeight: 800, fontSize: 16 };
