// src/pages/RoadmapPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoadmapPage.css";
import Footer from "../../components/FooterComponents/FooterComponent";

const API =
  (typeof process !== "undefined" && process.env.REACT_APP_API_URL?.replace(/\/$/, "")) ||
  "http://localhost:5000";
const RUNNER_ROUTE = "/toeicframe";

export default function RoadmapPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);      // RoadmapItem[] trong DB (Day 1, Day 2, ...)
  const [analysis, setAnalysis] = useState(""); // chỉ để hiển thị box phân tích
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token") || "";

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      // 1) Lấy roadmap đã sinh trong DB → sẽ có Day 2 nếu bạn vừa Finish Day 1
      const r = await fetch(`${API}/api/roadmap`, { headers: { Authorization: `Bearer ${token}` } });
      const arr = await r.json();
      const sorted = Array.isArray(arr) ? [...arr].sort((a, b) => (a.day || 0) - (b.day || 0)) : [];
      setItems(sorted);

      // 2) Optional: lấy phân tích AI đã lưu (không ảnh hưởng Day hiển thị)
      try {
        const a = await (await fetch(`${API}/api/recommend`, { headers: { Authorization: `Bearer ${token}` } })).json();
        setAnalysis(a?.analysis || "");
      } catch { }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoadmap(); /* eslint-disable-next-line */ }, []);

  const startDay = async (it) => {
    try {
      if (!it?.questionIds?.length) {
        // Nếu là Day 1 chưa có questionIds → nhờ server "khoá" Day 1
        if (Number(it?.day) === 1) {
          const r = await fetch(`${API}/api/roadmap/day1`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({}),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data?.error || "Không tạo được Day 1");
          it = data.item;
        } else {
          alert("Bài học chưa sẵn sàng.");
          return;
        }
      }
      nav(RUNNER_ROUTE, { state: { roadmapItem: it } });
    } catch (e) {
      console.error(e);
      alert("Không thể mở bài học.");
    }
  };

  const createDay1IfEmpty = async () => {
    const hasAny = items.length > 0;
    if (hasAny) return;
    try {
      const r = await fetch(`${API}/api/roadmap/day1`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Không tạo được Day 1");
      await fetchRoadmap();
    } catch (e) {
      console.error(e);
      alert("Không thể tạo Day 1. Hãy chạy /api/recommend nếu bạn dùng plan từ AI.");
    }
  };

  const Progress = ({ val = 0 }) => (
    <div style={{ background: "#f1f5f9", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${val}%`, background: "#0ea5e9", height: 8 }} />
    </div>
  );

  return (
    <div className="learning-container">
      <div className="learning-path">
        <h2>Lộ trình học của bạn</h2>

        {loading ? (
          <p>Đang tải lộ trình…</p>
        ) : (
          <>
            {analysis && (
              <div className="analysis-box">
                <h3>📊 Phân tích:</h3>
                <p style={{ whiteSpace: "pre-line" }}>{analysis}</p>
              </div>
            )}

            {!items.length && (
              <div style={{ marginBottom: 16 }}>
                <button className="tf-btn tf-btn--primary" onClick={createDay1IfEmpty}>
                  Tạo Day 1
                </button>
              </div>
            )}

            <div className="day-list">
              {items.map((it) => (
                <div key={it._id || it.day} className={`day-card ${it.skill}`}>
                  <h3>📅 Day {it.day}</h3>
                  <p className="title">{it.title || `Lesson - ${it.skill} Part ${it.part}`}</p>
                  <p className="skill">
                    Kỹ năng: <b>{it.skill}</b> • Part {it.part} • Level {it.level}
                  </p>

                  <div className={`status ${it.status}`}>
                    <Progress val={it.progress || 0} />
                    <p className="status-label">
                      {it.status === "done" ? "✅ Hoàn thành" : "⚠️ Chưa bắt đầu"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="tf-btn" onClick={() => startDay(it)}>Làm ngay</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="tf-btn" onClick={fetchRoadmap}>↻ Làm mới</button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
