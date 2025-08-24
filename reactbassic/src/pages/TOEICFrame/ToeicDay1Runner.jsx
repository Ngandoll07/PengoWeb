// src/pages/TOEICFrame/ToeicDay1Runner.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TOEICFrame from "./TOEICFrame.jsx";

/** Backend URL */
const API =
  (typeof process !== "undefined" && process.env.REACT_APP_API_URL?.replace(/\/$/, "")) ||
  "http://localhost:5000";

/** Route runner của bạn (khai báo trong index.js) */
const RUNNER_ROUTE = "/toeicframe";

/* ====== Utils ====== */
const toArr = (opts) =>
  Array.isArray(opts) ? opts : ["A", "B", "C", "D"].map((k) => opts?.[k]).filter(Boolean);
const ABCD = ["A", "B", "C", "D"];
const toAnsIdx = (ans) =>
  typeof ans === "number" ? ans : ABCD.indexOf(String(ans || "").trim().toUpperCase());

/** Tạo URL asset từ public/assets/... giữ nguyên đúng cấu trúc bạn đang dùng */
const assetURL = (name, meta = {}, kind = "audio") => {
  if (!name) return "";
  if (/^https?:\/\//i.test(name)) return name;
  if (name.startsWith("/")) return name; // /assets/...
  const testFolder = meta.testId || "Test1";
  const base = kind === "audio" ? "/assets/audio" : "/assets/images";
  return `${base}/${testFolder}/part${Number(meta.part || 1)}/${name}`;
};

export default function ToeicDay1Runner() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [item, setItem] = useState(state?.roadmapItem || null); // RoadmapItem của day hiện tại
  const [rawQs, setRawQs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState({}); // answers[page] = number | { [subIdx]: number }

  // Result modal
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null); // {correct,total,accuracy,labelStats,items,ai,skill,part}
  const [nextDay, setNextDay] = useState(null); // { day, item?, saved }
  const [saving, setSaving] = useState(false);

  /* ------- Tách hàm nạp dữ liệu để tái dùng khi Day đổi (vẫn cùng route) ------- */
  const loadItemAndQuestions = async (_item) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";

      // nếu chưa có item → xin Day 1
      if (!_item) {
        const r = await fetch(`${API}/api/roadmap/day1`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Không tạo được Day 1.");
        _item = data.item;
        setItem(_item);
      }

      const ids = _item.questionIds.join(",");
      const url =
        _item.skill === "listening"
          ? `${API}/questions/listening/by-ids?ids=${encodeURIComponent(ids)}`
          : _item.part === 5
            ? `${API}/questions/reading/p5/by-ids?ids=${encodeURIComponent(ids)}`
            : `${API}/questions/reading/p6p7/by-ids?ids=${encodeURIComponent(ids)}`;

      const qs = await (await fetch(url)).json();
      qs.forEach((q) => {
        if (!Array.isArray(q.options)) q.options = toArr(q.options);
        q.audio = assetURL(q.audio || q.audioPath, { part: _item.part, testId: q.testId }, "audio");
        q.image = assetURL(q.image || q.imagePath, { part: _item.part, testId: q.testId }, "image");
        q.answerIdx = toAnsIdx(q.answer);
      });
      setRawQs(qs);
    } finally {
      setLoading(false);
    }
  };

  /** Khởi tạo lần đầu */
  useEffect(() => {
    loadItemAndQuestions(item || state?.roadmapItem || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Khi navigate tới cùng route nhưng truyền roadmapItem mới → nạp lại đề */
  useEffect(() => {
    const incoming = state?.roadmapItem;
    if (!incoming) return;
    if (incoming._id === item?._id) return; // không đổi
    setItem(incoming);
    setPage(0);
    setAnswers({});
    setShowResult(false);
    setRawQs([]);
    loadItemAndQuestions(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.roadmapItem?._id]);

  /* ------- Dựng các trang hiển thị tuỳ part ------- */
  const pages = useMemo(() => {
    if (!item || !rawQs?.length) return [];
    const { skill: mode, part } = item;

    // L1/L2: mỗi câu = 1 trang
    if (mode === "listening" && (part === 1 || part === 2)) {
      return rawQs.map((q) => ({
        kind: "single",
        mode,
        part,
        qref: q, // giữ đầy đủ để lấy questionId khi submit
        title: "Choose the best answer.",
        data:
          part === 1
            ? { image: q.image, audio: q.audio, options: q.options }
            : { audio: q.audio, options: q.options },
      }));
    }

    // L3/L4: 1 audio = 1 trang (nhiều câu)
    if (mode === "listening" && (part === 3 || part === 4)) {
      const byAudio = new Map();
      for (const q of rawQs) {
        const key = q.audio || `grp_${q.questionId}`;
        if (!byAudio.has(key)) byAudio.set(key, []);
        byAudio.get(key).push({
          id: q.questionId,
          text: q.question,
          options: q.options,
          answerIdx: q.answerIdx,
          explanation: q.explanation,
          label: q.label,
        });
      }
      return Array.from(byAudio.entries()).map(([audio, group]) => ({
        kind: "group",
        mode,
        part,
        title: "Listen and answer the following questions.",
        data: { audio, group },
      }));
    }

    // R5: mỗi câu = 1 trang
    if (mode === "reading" && part === 5) {
      return rawQs.map((q) => ({
        kind: "single",
        mode,
        part,
        qref: q,
        title: "Choose the best answer.",
        data: { text: q.question, options: q.options },
      }));
    }

    // R6/R7: 1 passage = 1 trang (nhiều câu)
    if (mode === "reading" && (part === 6 || part === 7)) {
      const byPassage = new Map();
      for (const q of rawQs) {
        const key = q.passage || q.imagePath || `p_${q.questionId}`;
        if (!byPassage.has(key))
          byPassage.set(key, { passage: q.passage, imagePath: q.imagePath, qs: [] });
        byPassage.get(key).qs.push({
          id: q.questionId,
          text: q.question,
          options: q.options,
          answerIdx: q.answerIdx,
          explanation: q.explanation,
          label: q.label,
        });
      }
      return Array.from(byPassage.values()).map(({ passage, imagePath, qs }) => ({
        kind: "group",
        mode,
        part,
        title: "Read the text and answer the questions.",
        data:
          part === 6
            ? { passage, questions: qs }
            : { passages: [{ content: passage }], questions: qs },
      }));
    }
    return [];
  }, [item, rawQs]);

  const current = pages[page] || null;
  const total = pages.length;

  if (loading) return <div style={{ padding: 16 }}>Đang tải bài…</div>;
  if (!item || !total) return <div style={{ padding: 16 }}>Không có bài học</div>;

  /* ------- Chọn đáp án ------- */
  const selected = answers[page] ?? (current.kind === "single" ? null : {});
  const handleSelectSingle = (choice) => setAnswers((prev) => ({ ...prev, [page]: choice }));
  const handleSelectAt = (qIdx, choice) =>
    setAnswers((prev) => ({ ...prev, [page]: { ...(prev[page] || {}), [qIdx]: choice } }));

  /* ------- Finish: chấm, lưu, feedback AI, sinh day mới ------- */
  const onFinish = async () => {
    const items = [];
    let correct = 0;
    let totalQ = 0;
    const labelStats = {};

    pages.forEach((p, pIdx) => {
      if (p.kind === "single") {
        const q = p.qref;
        const userIdx = answers[pIdx] ?? null;
        const ok = userIdx != null && userIdx === q.answerIdx;
        if (ok) correct += 1;
        totalQ += 1;

        const label = q.label || "unknown";
        labelStats[label] = labelStats[label] || { total: 0, wrong: 0 };
        labelStats[label].total += 1;
        if (!ok) labelStats[label].wrong += 1;

        items.push({
          page: pIdx + 1,
          sub: 1,
          // >>> thêm questionId để backend loại trừ câu đã làm <<<
          questionId: q.questionId || q.id,
          question: q.question || null,
          options: q.options,
          userIdx,
          correctIdx: q.answerIdx,
          correctLetter: ABCD[q.answerIdx] || "",
          explanation: q.explanation || "",
          label,
        });
      } else {
        const qs = p.data.group || p.data.questions || [];
        const userMap = answers[pIdx] || {};
        qs.forEach((q, i) => {
          const userIdx = userMap[i] ?? null;
          const ok = userIdx != null && userIdx === q.answerIdx;
          if (ok) correct += 1;
          totalQ += 1;

          const label = q.label || "unknown";
          labelStats[label] = labelStats[label] || { total: 0, wrong: 0 };
          labelStats[label].total += 1;
          if (!ok) labelStats[label].wrong += 1;

          items.push({
            page: pIdx + 1,
            sub: i + 1,
            // >>> thêm questionId cho câu con <<<
            questionId: q.id || q.questionId,
            question: q.text || null,
            options: q.options,
            userIdx,
            correctIdx: q.answerIdx,
            correctLetter: ABCD[q.answerIdx] || "",
            explanation: q.explanation || "",
            label,
          });
        });
      }
    });

    const summary = {
      correct,
      total: totalQ,
      accuracy: totalQ ? Math.round((correct / totalQ) * 100) : 0,
      labelStats,
      skill: item.skill,
      part: item.part,
      items,
    };

    setSaving(true);
    try {
      const token = localStorage.getItem("token") || "";

      // Lưu bài
      try {
        await fetch(`${API}/api/lessons/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ roadmapItemId: item._id || null, answers, summary }),
        });
      } catch (e) {
        console.warn("submit lesson failed (ignored):", e);
      }

      // AI feedback (hoặc heuristic)
      let ai = "";
      try {
        const r = await fetch(`${API}/api/coach/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ summary }),
        });
        if (r.ok) ai = (await r.json())?.feedback || "";
      } catch { }
      if (!ai) ai = heuristicFeedback(summary);

      // Sinh day tiếp theo
      let next = null;
      try {
        const r = await fetch(`${API}/api/roadmap/next-day`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ baseItemId: item._id || null, performance: summary }),
        });
        if (r.ok) next = await r.json(); // { day, item, items?, saved }
      } catch (e) {
        console.warn("next-day api failed:", e);
      }

      setResult({ ...summary, ai });
      setNextDay(next);
      setShowResult(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TOEICFrame
        mode={current.mode}
        part={current.part}
        questionNo={page + 1}
        total={total}
        title={current.title}
        data={current.data}
        availableModes={[item.skill]}
        selected={current.kind === "single" ? selected : null}
        multiSelected={current.kind === "group" ? selected : null}
        onSelect={current.kind === "single" ? handleSelectSingle : undefined}
        onSelectAt={current.kind === "group" ? handleSelectAt : undefined}
        onBack={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(total - 1, p + 1))}
        onFinish={onFinish}
      />

      {showResult && result && (
        <ResultsModal
          result={result}
          nextDay={nextDay}
          onClose={() => setShowResult(false)}
          onGoPlan={() => navigate("/roadmap")}
          onStartNext={() => {
            if (nextDay?.item) {
              setShowResult(false);
              navigate(RUNNER_ROUTE, { state: { roadmapItem: nextDay.item } });
            } else {
              navigate("/roadmap");
            }
          }}
          saving={saving}
        />
      )}
    </>
  );
}

/* ====== Heuristic feedback khi không gọi AI ====== */
function heuristicFeedback(summary) {
  const { accuracy, labelStats, skill, part } = summary;
  const weak = Object.entries(labelStats)
    .filter(([, v]) => v.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 3)
    .map(([k, v]) => `${k} (${v.wrong}/${v.total})`);
  const topWeak = weak.length ? weak.join(", ") : "không có lỗi nổi bật";

  const tone =
    accuracy >= 85 ? "Rất tốt! Duy trì phong độ."
      : accuracy >= 60 ? "Ổn, nhưng cần siết lại vài điểm."
        : "Kết quả chưa cao, mình cần củng cố trọng tâm.";

  return [
    `${tone} Điểm chính còn yếu: ${topWeak}.`,
    skill === "listening"
      ? `Ở Part ${part}, bạn nên luyện nghe có mục tiêu: nghe *từ khóa chỉ hành động/vị trí*, phân biệt âm cuối, và luyện tốc độ ghi nhớ phương án.`
      : `Ở Part ${part}, ưu tiên luyện *từ vựng theo ngữ cảnh*, dấu hiệu ngữ pháp trong câu hỏi, và chiến thuật loại trừ nhanh.`,
    `Ngày tiếp theo mình đã tạo dựa trên các label sai nhiều nhất để bù đắp.`,
  ].join(" ");
}

/* ====== Modal UI (scroll nội dung, footer cố định) ====== */
function ResultsModal({ result, nextDay, onClose, onGoPlan, onStartNext, saving }) {
  const { correct, total, accuracy, ai, items } = result;

  return (
    <div style={backdropStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true" aria-label="Kết quả bài làm">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Kết quả</h3>
          <button onClick={onClose} style={xBtnStyle}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <Stat label="Đúng" value={String(correct)} />
          <Stat label="Tổng" value={String(total)} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        {ai && (
          <div style={aiBoxStyle}>
            <strong>AI nhận xét:</strong>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{ai}</div>
          </div>
        )}

        <div style={contentScrollableStyle}>
          {items.map((it, idx) => {
            const userLetter = it.userIdx == null ? "—" : ABCD[it.userIdx];
            const ok = it.userIdx != null && it.userIdx === it.correctIdx;
            return (
              <div key={idx} style={{ padding: "10px 6px", borderBottom: "1px solid #f1f1f1" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <b>Q{it.page}{it.sub > 1 ? `-${it.sub}` : ""}</b>{" "}
                    {it.label ? <em style={{ opacity: 0.7 }}>• {it.label}</em> : null}
                  </div>
                  <div style={{ color: ok ? "#0a7d32" : "#b71d18", fontWeight: 700 }}>
                    {ok ? "Correct" : "Incorrect"}
                  </div>
                </div>
                {it.question && <div style={{ margin: "6px 0" }}>{it.question}</div>}
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  <span style={{ marginRight: 12 }}>Your: <b>{userLetter}</b></span>
                  <span>Answer: <b>{ABCD[it.correctIdx] || ""}</b></span>
                </div>
                {it.explanation && (
                  <div style={{ marginTop: 6, color: "#0f172a", background: "#f8fafc", padding: 8, borderRadius: 6 }}>
                    {it.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={footerBarStyle}>
          <button onClick={onGoPlan} className="tf-btn">Về lộ trình</button>
          <button disabled={saving} className="tf-btn tf-btn--primary" onClick={nextDay?.item ? onStartNext : onGoPlan}>
            {nextDay?.item ? `Làm Day ${nextDay.day}` : "Xem lộ trình mới"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Small UI bits */
function Stat({ label, value }) {
  return (
    <div style={{
      flex: "0 0 auto", minWidth: 110, border: "1px solid #e5e7eb",
      borderRadius: 8, padding: "10px 12px", background: "#fff",
    }}>
      <div style={{ fontSize: 12, color: "#334155" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const backdropStyle = {
  position: "fixed", inset: 0, background: "rgba(15, 23, 42, .35)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999, padding: 16, overscrollBehavior: "contain",
};
const modalStyle = {
  width: "min(920px, 92vw)", maxHeight: "90vh", background: "#fff",
  borderRadius: 12, padding: 16, boxShadow: "0 12px 40px rgba(0,0,0,.18)",
  display: "flex", flexDirection: "column",
};
const contentScrollableStyle = {
  flex: 1, minHeight: 0, overflowY: "auto", marginTop: 12,
  border: "1px solid #eee", borderRadius: 8, padding: 10,
};
const footerBarStyle = {
  position: "sticky", bottom: 0, marginTop: 10, display: "flex",
  justifyContent: "flex-end", gap: 8, background: "#fff", paddingTop: 10,
  boxShadow: "0 -6px 12px rgba(0,0,0,.05)",
};
const xBtnStyle = { border: "none", background: "transparent", fontSize: 18, cursor: "pointer" };
const aiBoxStyle = { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 10, marginTop: 12 };
