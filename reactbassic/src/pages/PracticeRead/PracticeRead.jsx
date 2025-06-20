import React, { useState, useEffect } from 'react';
import './PracticeRead.css';
import { useNavigate, useLocation } from "react-router-dom";


const PracticeRead = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showAnswers = location.state?.showAnswers || false;

  const [questionsByPart, setQuestionsByPart] = useState({ 5: [] });
  const [answersByPart, setAnswersByPart] = useState({ 5: [] });
  const [submitted, setSubmitted] = useState(showAnswers); // ✅ Bây giờ dùng đúng chỗ
  const [activePart, setActivePart] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch Part 5 questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/reading-tests/part/5");
        const data = await res.json();

        const formatted = data.map(q => ({
          question: q.question,
          options: [q.options.A, q.options.B, q.options.C, q.options.D],
          answer: q.answer
        }));

        setQuestionsByPart({ 5: formatted });
        setAnswersByPart({ 5: Array(formatted.length).fill(null) });
      } catch (err) {
        console.error("Lỗi tải đề Part 5:", err);
      }
    };

    fetchQuestions();
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const handleSelect = (index, option) => {
    if (submitted) return;
    const updatedAnswers = [...answersByPart[activePart]];
    updatedAnswers[index] = option;
    setAnswersByPart({ ...answersByPart, [activePart]: updatedAnswers });
  };

const handleSubmit = () => {
  setSubmitted(true);

  const userAnswers = answersByPart[activePart];
  const questions = questionsByPart[activePart];
  let correct = 0;

  userAnswers.forEach((answer, i) => {
    const correctAnswerLetter = questions[i].answer?.trim()?.toUpperCase();
    const correctAnswerText = questions[i].options[
      ["A", "B", "C", "D"].indexOf(correctAnswerLetter)
    ];

    const selectedText = answer?.trim();

    if (selectedText === correctAnswerText?.trim()) {
      correct++;
    }
  });

  const result = {
    correct,
    incorrect: questions.length - correct,
    skipped: userAnswers.filter(ans => ans === null).length,
    total: questions.length,
    score: correct * 5, // hoặc tính điểm theo logic riêng
    accuracy: Math.round((correct / questions.length) * 100),
    time: formatTime(elapsedTime),
    readingScore: correct * 5, // ví dụ
    readingCorrect: correct
  };

  navigate("/result", { state: result });
};


  const handleReset = () => {
    setAnswersByPart({ 5: Array(questionsByPart[5]?.length || 0).fill(null) });
    setSubmitted(false);
    setElapsedTime(0);
  };

  const currentQuestions = questionsByPart[activePart] || [];
  const currentAnswers = answersByPart[activePart] || [];

  return (
    <div className="toeic-container">
      <h1 className="page-title">Luyện đọc TOEIC - Part {activePart}</h1>
      <div className="test-panel">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="score-button" onClick={handleSubmit}>Chấm điểm</button>
            <span className="timer">{formatTime(elapsedTime)}</span>
            <button className="reset-button" onClick={handleReset}>
              <img src="/assets/Undo Arrow.png" className="undo" alt="reset" /> Làm lại
            </button>
          </div>
          <div className="part-tabs-bar">
            {[5].map(part => (
              <button
                key={part}
                className={`part-tab ${activePart === part ? 'active' : ''}`}
                onClick={() => setActivePart(part)}
              >
                Part {part}
              </button>
            ))}
          </div>
          <div className="question-grid">
            {currentAnswers.map((ans, i) => (
              <button
                key={i}
                className={`question-number ${ans ? 'answered' : ''}`}
                onClick={() => {
                  const el = document.getElementById(`q${i}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="question-area">
          {currentQuestions.map((q, i) => (
            <div className="question-block" key={i} id={`q${i}`}>
              <h4>Câu {i + 1}</h4>
              <p>{q.question}</p>
              <div className="options">
                {q.options.map((opt, idx) => (
                  <label key={idx} className={`option ${currentAnswers[i] === opt ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={opt}
                      checked={currentAnswers[i] === opt}
                      onChange={() => handleSelect(i, opt)}
                    />
                    {String.fromCharCode(65 + idx)}. {opt}
                  </label>
                ))}
              </div>
              {submitted && (
                <div className={`feedback ${currentAnswers[i] === q.answer ? 'correct' : 'incorrect'}`}>
                  Đáp án đúng: <strong>{q.answer}</strong>
                </div>
              )}
            </div>
          ))}
          <button className="submit-btn" onClick={handleSubmit}>NỘP BÀI</button>
        </div>
      </div>
    </div>
  );
};

export default PracticeRead;
