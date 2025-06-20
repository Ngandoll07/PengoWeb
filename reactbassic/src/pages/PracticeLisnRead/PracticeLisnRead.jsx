import React, { useState, useEffect, useRef } from "react";
import "./PracticeLisnRead.css";

const partList = [
  "Part 1", "Part 2", "Part 3", "Part 4",
  "Part 5", "Part 6", "Part 7"
];

export default function PracticeLisnRead() {
  const [activePart, setActivePart] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [listeningQuestions, setListeningQuestions] = useState([]);
  const [readingQuestions, setReadingQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [studyPlan, setStudyPlan] = useState(null);
  const questionRefs = useRef({});
  const timerRef = useRef(null);

  useEffect(() => {
    fetch("/data/test1_listening.json")
      .then((res) => res.json())
      .then((data) => setListeningQuestions(data))
      .catch((err) => console.error("Lỗi tải listening:", err));

    fetch("/data/test1_reading.json")
      .then((res) => res.json())
      .then((data) => setReadingQuestions(data))
      .catch((err) => console.error("Lỗi tải reading:", err));
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    questionRefs.current = {};
  }, [activePart]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitScore();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getQuestionsByPart = () => {
    const allQuestions = activePart <= 4 ? listeningQuestions : readingQuestions;
    const seen = new Set();
    return allQuestions.filter((q) => {
      const partValue = typeof q.part === "string" ? parseInt(q.part) : q.part;
      if (partValue !== activePart) return false;
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  };

  const questionsByPart = getQuestionsByPart();

  const handleClickQuestion = (questionId) => {
    setSelectedQuestion(questionId);
    const target = questionRefs.current[questionId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderOptions = (questionId, options) => (
    <div className="option-list">
      {Object.entries(options).map(([key, value]) => (
        <div
          key={key}
          className={`option-item ${selectedAnswers[questionId] === key ? "selected" : ""}`}
          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [questionId]: key }))}
        >
          <strong>{key}. </strong>{value}
        </div>
      ))}
    </div>
  );

 // phần đầu giữ nguyên...

const handleSubmitScore = async () => {
  const allQuestions = [...listeningQuestions, ...readingQuestions];
  let total = 0;
  let correct = 0;
  let listeningCorrect = 0;
  let readingCorrect = 0;
  const seenIds = new Set();

  allQuestions.forEach((q) => {
    const part = parseInt(q.part);
    if (q.questions) {
      q.questions.forEach((subQ) => {
        if (seenIds.has(subQ.id)) return;
        seenIds.add(subQ.id);
        total++;
        if (selectedAnswers[subQ.id] === subQ.answer) correct++;
        if (part <= 4 && selectedAnswers[subQ.id] === subQ.answer) listeningCorrect++;
        if (part > 4 && selectedAnswers[subQ.id] === subQ.answer) readingCorrect++;
      });
    } else if (q.answer) {
      if (seenIds.has(q.id)) return;
      seenIds.add(q.id);
      total++;
      if (selectedAnswers[q.id] === q.answer) correct++;
      if (part <= 4 && selectedAnswers[q.id] === q.answer) listeningCorrect++;
      if (part > 4 && selectedAnswers[q.id] === q.answer) readingCorrect++;
    }
  });

  const percent = ((correct / total) * 100).toFixed(2);
  const confirmReset = window.confirm(
    `🎯 Bạn đã đúng ${correct}/${total} câu (${percent}%)\n\nBạn có muốn làm lại bài không?`
  );
  if (confirmReset) handleReset(); // ✅ chỉ reset khi người dùng xác nhận

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
      },
      body: JSON.stringify({ listeningScore: listeningCorrect, readingScore: readingCorrect })
    });

    const data = await res.json();
    if (res.status === 401) {
      alert("⚠️ Bạn cần đăng nhập để lưu lộ trình học cá nhân.");
    }
    setStudyPlan(data.suggestion);
  } catch (err) {
    console.error("❌ Lỗi gọi API:", err);
  }
};


  const handleReset = () => {
    setSelectedAnswers({});
    setSelectedQuestion(null);
    setStudyPlan(null);
    setTimeLeft(60 * 60);
    startTimer();
  };

  return (
    <div className="practice-lisn-read">
      <h1 className="page-title">Luyện tập TOEIC Listening & Reading</h1>
      <div className="toeic-page1">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="score-button" onClick={handleSubmitScore}>Chấm điểm</button>
            <span className="timer">{new Date(timeLeft * 1000).toISOString().substr(11, 8)}</span>
            <button className="reset-button" onClick={handleReset}>
              <img src="/assets/Undo Arrow.png" className="undo" alt="reset" />Làm lại
            </button>
          </div>

          <div className="part-tabs">
            {partList.map((part, idx) => (
              <button
                key={idx}
                className={`part-tab ${activePart === idx + 1 ? "active" : ""}`}
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
            {questionsByPart.flatMap((q) =>
              q.questions ? q.questions.map((subQ) => (
                <div
                  key={subQ.id}
                  className={`question-circle
                    ${selectedQuestion === subQ.id ? "selected" : ""}
                    ${selectedAnswers[subQ.id] ? "answered" : ""}`}
                  onClick={() => handleClickQuestion(subQ.id)}
                >
                  {subQ.id.replace("q", "")}
                </div>
              )) : (
                <div
                  key={q.id}
                  className={`question-circle
                    ${selectedQuestion === q.id ? "selected" : ""}
                    ${selectedAnswers[q.id] ? "answered" : ""}`}
                  onClick={() => handleClickQuestion(q.id)}
                >
                  {q.id.replace("q", "")}
                </div>
              )
            )}
          </div>
        </div>

        <div className="content-area">
          <h2>Nội dung {partList[activePart - 1]}</h2>
          {questionsByPart.map((q, idx) => (
            <div
              key={q.id}
              ref={(el) => {
                if (!q.questions) questionRefs.current[q.id] = el;
              }}
              className="question-block"
            >
              <h4>{q.id.startsWith("q") ? `Câu ${q.id.replace("q", "")}` : `Đoạn ${q.id}`}</h4>
              {q.audio && <audio controls><source src={q.audio} type="audio/mp3" /></audio>}
              {q.image && <img src={q.image} alt={`Câu ${idx + 1}`} className="question-image" />}
              {q.question && (
                <>
                  <p>{q.question}</p>
                  {q.options && renderOptions(q.id, q.options)}
                </>
              )}
              {q.paragraph && (
                <>
                  <p>{q.paragraph}</p>
                  {q.questions.map((subQ) => (
                    <div
                      key={subQ.id}
                      ref={(el) => (questionRefs.current[subQ.id] = el)}
                      className="sub-question"
                    >
                      <p><strong>{`Câu ${subQ.id.replace("q", "")}`}</strong>: {subQ.question}</p>
                      {renderOptions(subQ.id, subQ.options)}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}

          {studyPlan && (
            <div className="study-plan-box">
              <h3>🧠 Lộ trình học cá nhân hóa</h3>
              <pre className="study-plan-text">{studyPlan}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
