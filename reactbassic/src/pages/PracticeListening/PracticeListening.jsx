import React, { useState, useEffect, useRef } from "react";
import "./PracticeListening.css";

const partList = ["Part 1", "Part 2", "Part 3", "Part 4", "Part 5", "Part 6", "Part 7"];

export default function PracticeListening() {
  const [questions, setQuestions] = useState([]);
  const [activePart, setActivePart] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const questionRefs = useRef({});

  useEffect(() => {
    fetch("/data/test1_listening.json")
      .then((res) => res.json())
      .then(setQuestions)
      .catch((err) => console.error("❌ Lỗi tải dữ liệu:", err));
  }, []);

  const handleSubmit = async () => {
    const payload = {
      questionIds: Object.keys(selectedAnswers),
      selectedAnswers,
    };

    try {
      const res = await fetch("http://localhost:5000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("❌ Lỗi submit:", err);
    }
  };

  const handleClickQuestion = (id) => {
    setSelectedQuestion(id);
    const target = questionRefs.current[id];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const questionsInPart = questions.filter(q => parseInt(q.part) === activePart);

  return (
    <div className="toeic-page">
      <h1 className="page-title">Luyện nghe TOEIC</h1>
      <div className="toeic-listening">
        {/* === Sidebar === */}
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="score-button" onClick={handleSubmit}>Chấm điểm</button>
            <span className="timer">{new Date(0).toISOString().substr(11, 8)}</span>
            <button className="reset-button" onClick={() => {
              setSelectedAnswers({});
              setResults(null);
            }}>🔁 Làm lại</button>
          </div>

          <div className="part-tabs">
            {partList.map((part, idx) => (
              <button
                key={idx}
                className={activePart === idx + 1 ? "part-tab active" : "part-tab"}
                onClick={() => {
                  setActivePart(idx + 1);
                  setSelectedQuestion(null);
                }}
              >
                {part}
              </button>
            ))}
          </div>

          <div className="question-grid">
            {questionsInPart.map((q) => (
              <div
                key={q.id}
                className={`question-circle ${selectedQuestion === q.id ? "selected" : ""} ${selectedAnswers[q.id] ? "answered" : ""}`}
                onClick={() => handleClickQuestion(q.id)}
              >
                {q.id.replace("q", "")}
              </div>
            ))}
          </div>
        </div>

        {/* === Nội dung chính === */}
        <div className="content-area">
          {questionsInPart.map((q, idx) => (
            <div
              key={q.id}
              ref={(el) => (questionRefs.current[q.id] = el)}
              className="question-block"
            >
              <h4>Câu {q.id.replace("q", "")}</h4>
              <audio controls>
                <source src={q.audio} type="audio/mp3" />
              </audio>
              {q.image && <img src={q.image} alt={`Câu ${q.id}`} className="question-image" />}
              <p>{q.question}</p>
              <div className="option-list">
                {Object.entries(q.options).map(([key, value]) => (
                  <div
                    key={key}
                    className={`option-item ${selectedAnswers[q.id] === key ? "selected" : ""}`}
                    onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: key }))}
                  >
                    <strong>{key}.</strong> {value}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* === Kết quả === */}
          {results && (
            <div className="results-box">
              <h3>Kết quả 🎯</h3>
              <p>✅ Số câu đúng: {results.correct}/{results.total}</p>
              <p>🗣️ Transcript:</p>
              <pre>{results.transcript}</pre>
              <ul>
                {results.results.map((r) => (
                  <li key={r.id}>
                    <strong>{r.id}</strong>: {r.isCorrect
                      ? "✔️ Đúng"
                      : `❌ Sai (Chọn ${r.userAnswer || "Không chọn"}, Đáp án ${r.correctAnswer})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
