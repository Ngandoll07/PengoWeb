import React, { useState, useEffect, useRef } from "react";
import "./PracticeListening.css";

const partList = ["Part 1", "Part 2", "Part 3", "Part 4"];

export default function PracticeListening() {
  const [questions, setQuestions] = useState([]);
  const [activePart, setActivePart] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const questionRefs = useRef({});

  useEffect(() => {
    fetch("/data/test1_listening.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          console.error("❌ Dữ liệu không phải mảng:", data);
          setError("Dữ liệu câu hỏi không đúng định dạng.");
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi tải dữ liệu:", err);
        setError("Không thể tải câu hỏi.");
      });
  }, []);

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length === 0) return;
    setLoading(true);
    setError("");
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
      if (!res.ok) {
        const text = await res.text();
        console.error("Evaluate error:", text);
        setError("Lỗi server khi chấm bài.");
        setResults(null);
      } else {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("❌ Lỗi submit:", err);
      setError("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  const handleClickQuestion = (id) => {
    setSelectedQuestion(id);
    const target = questionRefs.current[id];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const questionsInPart = Array.isArray(questions)
    ? questions.filter((q) => parseInt(q.part, 10) === activePart)
    : [];

  const resultMap =
    results?.results?.reduce((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {}) || {};

  return (
    <div className="toeic-page">
      <h1 className="page-title">Luyện nghe TOEIC</h1>
      <div className="toeic-listening">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <button
              className="score-button"
              onClick={handleSubmit}
              disabled={loading || Object.keys(selectedAnswers).length === 0}
            >
              {loading ? "Đang chấm..." : "Chấm điểm"}
            </button>
            <span className="timer">{new Date(0).toISOString().substr(11, 8)}</span>
            <button
              className="reset-button"
              onClick={() => {
                setSelectedAnswers({});
                setResults(null);
                setError("");
              }}
            >
              🔁 Làm lại
            </button>
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
            {Array.isArray(questionsInPart) &&
              questionsInPart.map((q) => (
                <div
                  key={q.id}
                  className={`question-circle ${
                    selectedQuestion === q.id ? "selected" : ""
                  } ${selectedAnswers[q.id] ? "answered" : ""}`}
                  onClick={() => handleClickQuestion(q.id)}
                >
                  {q.id.replace("q", "")}
                </div>
              ))}
          </div>

          {error && <div className="sidebar-error">{error}</div>}
        
        </div>

        {/* Content area */}
        <div className="content-area">
          {Array.isArray(questionsInPart) &&
            questionsInPart.map((q) => {
              const res = resultMap[q.id];
              return (
                <div
                  key={q.id}
                  ref={(el) => (questionRefs.current[q.id] = el)}
                  className="question-block"
                >
                  <h4>Câu {q.id.replace("q", "")}</h4>
                  <audio controls>
                    <source src={q.audio} type="audio/mp3" />
                  </audio>
                  {q.image && (
                    <img src={q.image} alt={`Câu ${q.id}`} className="question-image" />
                  )}
                  <p>{q.question}</p>
                  <div className="option-list">
                    {q.options &&
                      Object.entries(q.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`option-item ${
                            selectedAnswers[q.id] === key ? "selected" : ""
                          } ${res ? (res.correctAnswer === key ? "correct-opt" : "") : ""} ${
                            res && selectedAnswers[q.id] === key && res.correctAnswer !== key
                              ? "wrong-opt"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q.id]: key,
                            }))
                          }
                        >
                          <strong>{key}.</strong> {value}
                        </div>
                      ))}
                  </div>

                  {/* Kết quả từng câu */}
                  {res && (
                    <div className={`question-result ${res.isCorrect ? "correct" : "wrong"}`}>
                      <div className="result-header">
                        {res.isCorrect ? (
                          <span className="status correct">✔️ Đúng</span>
                        ) : (
                          <span className="status wrong">
                            ❌ Sai (Bạn chọn: {res.userAnswer || "Không chọn"}, Đáp án đúng:{" "}
                            {res.correctAnswer})
                          </span>
                        )}
                        {res.focusTopic && (
                          <span className="focus-topic">[{res.focusTopic}]</span>
                        )}
                      </div>
                      {res.explanation && (
                        <p className="explanation">{res.explanation}</p>
                      )}
                      {res.transcript && (
                        <div className="transcript-line">
                          🗣️ <em>{res.transcript}</em>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
