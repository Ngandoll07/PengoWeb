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
  const [scorePopup, setScorePopup] = useState(null);

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const questionRefs = useRef({});

  // Timer
  useEffect(() => {
    let interval;
    if (isRunning) interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  // Lấy câu hỏi từ BE
useEffect(() => {
 fetch("http://localhost:5000/api/listening-questions")
  .then(res => res.json())
  .then(data => {
    if (data.success && Array.isArray(data.questions)) {
      setQuestions(data.questions);
    } else {
      setError("❌ Dữ liệu không hợp lệ từ server");
    }
  })
  .catch(() => setError("❌ Không thể tải dữ liệu"));

}, []);

const handleSubmit = () => {
  if (questions.length === 0) return;
  setIsRunning(false);

  let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;

  const evaluated = questions.map((q) => {
    const userAnswer = selectedAnswers[q.id] || null;
    const isCorrect = userAnswer === q.answer;

    if (!userAnswer) totalSkipped++;
    else if (isCorrect) totalCorrect++;
    else totalIncorrect++;

    return {
      ...q,
      userAnswer,
      correctAnswer: q.answer,
      isCorrect,
    };
  });

  const totalQuestions = evaluated.length;
  const accuracy = totalQuestions ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0;

  setResults({ results: evaluated });

  setScorePopup({
    correct: totalCorrect,
    incorrect: totalIncorrect,
    skipped: totalSkipped,
    accuracy,
    time: formatTime(time),
    score: totalCorrect * 5,
    total: totalQuestions,
  });
};


  const handleClickQuestion = (id) => {
    setSelectedQuestion(id);
    const el = questionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const questionsInPart = questions.filter(
    (q) => parseInt(q.part, 10) === activePart
  );

  const resultMap =
    results?.results.reduce((acc, r) => {
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
              disabled={loading || !Object.keys(selectedAnswers).length}
            >
              {loading ? "Đang chấm..." : "Chấm điểm"}
            </button>
            <span className="timer">{formatTime(time)}</span>
            <button
              className="reset-button"
              onClick={() => {
                setSelectedAnswers({});
                setResults(null);
                setError("");
                setTime(0);
                setIsRunning(true);
                setScorePopup(null);
              }}
            >
              <img src="/assets/Undo Arrow.png" className="undo" alt="reset" />{" "}
              Làm lại
            </button>
          </div>

          <div className="part-tabs">
            {partList.map((p, i) => (
              <button
                key={i}
                className={activePart === i + 1 ? "part-tab active" : "part-tab"}
                onClick={() => {
                  setActivePart(i + 1);
                  setSelectedQuestion(null);
                }}
              >
                {p}
              </button>
            ))}
          </div>
                <div className="question-grid">
          {questionsInPart.map((q, index) => (
            <div
              key={q.id}
              className={`question-circle ${
                selectedQuestion === q.id ? "selected" : ""
              } ${selectedAnswers[q.id] ? "answered" : ""}`}
              onClick={() => handleClickQuestion(q.id)}
            >
              {index + 1}
            </div>
          ))}
        </div>
          {error && <div className="sidebar-error">{error}</div>}
        </div>

        {/* Content */}
        <div className="content-area">
          {questionsInPart.map((q) => {
            const res = resultMap[q.id];
            return (
              <div
                key={q.id}
                ref={(el) => (questionRefs.current[q.id] = el)}
                className="question-block"
              >
               <h4>Câu {Number(q.id.split("_q")[1])}</h4>
                <audio controls>
                  <source src={q.audio} type="audio/mp3" />
                </audio>
                {q.image && (
                  <img src={q.image} alt={`Câu ${q.id}`} className="question-image" />
                )}
                <p>{q.question}</p>

                <div className="option-list">
                  {Object.entries(q.options).map(([k, v]) => (
                    <div
                      key={k}
                      className={`option-item ${
                        selectedAnswers[q.id] === k ? "selected" : ""
                      } ${
                        res
                          ? res.correctAnswer === k
                            ? "correct-opt"
                            : ""
                          : ""
                      } ${
                        res && selectedAnswers[q.id] === k && res.correctAnswer !== k
                          ? "wrong-opt"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [q.id]: k }))
                      }
                    >
                      <strong>{k}.</strong> {v}
                    </div>
                  ))}
                </div>

              {res && (
                <div
                  className={`question-result ${res.isCorrect ? "correct" : "wrong"}`}
                >
                  <div className="result-header">
                    {res.isCorrect ? (
                      <span className="status correct">✔️ Chính xác</span>
                    ) : (
                      <span className="status wrong">
                        ❌ Sai &nbsp;|&nbsp; 
                        <strong>Bạn chọn:</strong> {res.userAnswer || "Không chọn"} &nbsp; 
                        <strong>Đáp án đúng:</strong> {res.correctAnswer}
                      </span>
                    )}
                    {q.label && <span className="focus-topic">[{q.label}]</span>}
                  </div>

                  {q.explanation && (
                    <p className="explanation">
                      <strong>💡 Giải thích:</strong> {q.explanation}
                    </p>
                  )}

                  {q.transcript && (
                    <div className="transcript-line">
                      🗣️ <em>{q.transcript}</em>
                    </div>
                  )}
                </div>
              )}
                
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup điểm */}
      {scorePopup && (
        <div className="popup-overlay">
          <div className="result-popup">
            <div className="result-content">
              <h3>Kết quả bài thi</h3>
              <p>✅ Đúng: {scorePopup.correct}</p>
              <p>❌ Sai: {scorePopup.incorrect}</p>
              <p>⚪ Bỏ qua: {scorePopup.skipped}</p>
              <p>📊 Chính xác: {scorePopup.accuracy}%</p>
              <p>🕒 Thời gian: {scorePopup.time}</p>
              <p>🏆 Điểm: {scorePopup.score}</p>
              <button onClick={() => setScorePopup(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
