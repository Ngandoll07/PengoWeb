import React, { useState, useEffect } from 'react';
import './PracticeRead.css';

const partQuestions = {
  5: new Array(5).fill({
    question: "Part 5: _______ the end of year results were published, the managers got their bonuses.",
    options: ['Before', 'While', 'Although', 'When']
  }),
  6: new Array(6).fill({
    question: "Part 6: _______ we arrived, the event had already started.",
    options: ['When', 'After', 'While', 'Until']
  }),
  7: new Array(5).fill({
    question: "Part 7: _______ is the main purpose of the text?",
    options: ['To inform', 'To request', 'To apply', 'To reject']
  })
};

const PracticeRead = () => {
  const [answersByPart, setAnswersByPart] = useState({
    5: Array(5).fill(null),
    6: Array(6).fill(null),
    7: Array(5).fill(null),
  });

  const [submitted, setSubmitted] = useState(false);
  const [activePart, setActivePart] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer start
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs} : ${mins} : ${secs}`;
  };

  const handleSelect = (qIndex, option) => {
    if (!submitted) {
      const updatedAnswers = { ...answersByPart };
      const newAnswers = [...updatedAnswers[activePart]];
      newAnswers[qIndex] = option;
      updatedAnswers[activePart] = newAnswers;
      setAnswersByPart(updatedAnswers);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    alert('Bài làm đã được nộp!');
  };

  const handleReset = () => {
    setAnswersByPart({
      5: Array(5).fill(null),
      6: Array(6).fill(null),
      7: Array(5).fill(null),
    });
    setSubmitted(false);
    setActivePart(5);
    setElapsedTime(0); // Reset timer
  };

  const currentQuestions = partQuestions[activePart];
  const currentAnswers = answersByPart[activePart];

  return (
    <div className="toeic-container">
      <h1 className="page-title">Luyện nghe TOEIC</h1>
      <div className="test-panel">
        <div className="sidebar">
          {/* Header: Score, Timer, Reset */}
          <div className="sidebar-header">
            <button className="score-button" onClick={handleSubmit}>Chấm điểm</button>
            <span className="timer">{formatTime(elapsedTime)}</span>
            <button className="reset-button" onClick={handleReset}>
              <img src="/assets/Undo Arrow.png" className="undo" alt="reset" /> Làm lại
            </button>
          </div>

          <div className="part-tabs-bar">
            {[5, 6, 7].map((part) => (
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
                  const questionElem = document.getElementById(`q${i}`);
                  if (questionElem) questionElem.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="question-area">
          {currentQuestions.map((q, idx) => (
            <div className="question-block" key={idx} id={`q${idx}`}>
              <h4>Question {idx + 1}</h4>
              <p>{q.question}</p>
              <div className="options">
                {q.options.map((opt, i) => (
                  <label key={i} className={`option ${currentAnswers[idx] === opt ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={opt}
                      checked={currentAnswers[idx] === opt}
                      onChange={() => handleSelect(idx, opt)}
                    />
                    {String.fromCharCode(65 + i)}. {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button className="submit-btn" onClick={handleSubmit}>NỘP BÀI</button>
        </div>
      </div>
    </div>
  );
};

export default PracticeRead;
