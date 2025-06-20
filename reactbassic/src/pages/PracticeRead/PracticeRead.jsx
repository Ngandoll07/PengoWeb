import React, { useState, useEffect } from 'react';
import './PracticeRead.css';
import { useNavigate, useLocation } from 'react-router-dom';

const PracticeRead = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showAnswers = location.state?.showAnswers || false;
  const storedAnswers = location.state?.result?.answersByPart;

  const [questionsByPart, setQuestionsByPart] = useState({ 5: [], 6: [], 7: [] });
  const [answersByPart, setAnswersByPart] = useState({ 5: [], 6: [], 7: [] });
  const [submitted, setSubmitted] = useState(showAnswers);
  const [activePart, setActivePart] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res5 = await fetch("http://localhost:5000/api/reading-tests/part/5");
        const data5 = await res5.json();
        const formatted5 = data5.map(q => ({
          question: q.question,
          options: [q.options.A, q.options.B, q.options.C, q.options.D],
          answer: q.answer
        }));

        const res6 = await fetch("http://localhost:5000/api/reading-tests/part/6");
        const blocks6 = await res6.json();
        const formatted6 = [];
        blocks6.forEach(block => {
          block.questions.forEach(q => {
            formatted6.push({
              passage: block.passage,
              question: q.question,
              options: [q.options.A, q.options.B, q.options.C, q.options.D],
              answer: q.answer
            });
          });
        });

        const res7 = await fetch("http://localhost:5000/api/reading-tests/part/7");
        const blocks7 = await res7.json();
        const formatted7 = [];
        blocks7.forEach(block => {
          block.questions.forEach(q => {
            formatted7.push({
              passage: block.passage,
              question: q.question,
              options: [q.options.A, q.options.B, q.options.C, q.options.D],
              answer: q.answer
            });
          });
        });

        setQuestionsByPart({ 5: formatted5, 6: blocks6, 7: blocks7 });
        setAnswersByPart({
          5: storedAnswers?.[5] || Array(formatted5.length).fill(null),
          6: storedAnswers?.[6] || Array(formatted6.length).fill(null),
          7: storedAnswers?.[7] || Array(formatted7.length).fill(null)
        });
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
      }
    };

    fetchData();
  }, []);

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
    const updated = [...answersByPart[activePart]];
    updated[index] = option;
    setAnswersByPart(prev => ({ ...prev, [activePart]: updated }));
  };

  const handleSubmit = () => {
    setSubmitted(true);

    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalSkipped = 0;
    const readingCorrect = { 5: 0, 6: 0, 7: 0 };

    [5, 6, 7].forEach(part => {
      let questions = [];
      if (part === 5) {
        questions = questionsByPart[5];
      } else {
        questionsByPart[part].forEach(block => {
          block.questions.forEach(q => {
            questions.push({
              options: [q.options.A, q.options.B, q.options.C, q.options.D],
              answer: q.answer
            });
          });
        });
      }

      const userAnswers = answersByPart[part];
      let partCorrect = 0;
      userAnswers.forEach((answer, i) => {
        const correctLetter = questions[i].answer?.trim().toUpperCase();
        const correctText = questions[i].options["ABCD".indexOf(correctLetter)];
        if (answer?.trim() === correctText?.trim()) partCorrect++;
      });

      readingCorrect[part] = partCorrect;
      totalCorrect += partCorrect;
      totalQuestions += questions.length;
      totalSkipped += userAnswers.filter(ans => ans === null).length;
    });

    const result = {
      correct: totalCorrect,
      incorrect: totalQuestions - totalCorrect,
      skipped: totalSkipped,
      total: totalQuestions,
      score: totalCorrect * 5,
      accuracy: Math.round((totalCorrect / totalQuestions) * 100),
      time: formatTime(elapsedTime),
      readingScore: totalCorrect * 5,
      readingCorrect: totalCorrect,
      answersByPart,
    };

    navigate("/result", { state: result });
  };

  const handleReset = () => {
    const length = activePart === 5 ? questionsByPart[5].length :
      questionsByPart[activePart]?.reduce((acc, block) => acc + block.questions.length, 0);
    setAnswersByPart(prev => ({ ...prev, [activePart]: Array(length).fill(null) }));
    setSubmitted(false);
    setElapsedTime(0);
  };

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
            {[5, 6, 7].map(part => (
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
                onClick={() => document.getElementById(`q${i}`)?.scrollIntoView({ behavior: 'smooth' })}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="question-area">
          {(activePart === 5 && questionsByPart[5].map((q, i) => (
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
          ))) ||
            ([6, 7].includes(activePart) && questionsByPart[activePart].map((block, blockIdx) => (
              <div className="passage-block" key={blockIdx}>
                <div className="passage-text">
                  <strong>Đoạn văn:</strong>
                  <p>{block.passage}</p>
                </div>
                {block.questions.map((q, qIdx) => {
                  const globalIndex = questionsByPart[activePart]
                    .slice(0, blockIdx)
                    .reduce((acc, b) => acc + b.questions.length, 0) + qIdx;
                  return (
                    <div className="question-block" key={globalIndex} id={`q${globalIndex}`}>
                      <h4>Câu {globalIndex + 1}</h4>
                      <p>{q.question}</p>
                      <div className="options">
                        {["A", "B", "C", "D"].map((key, idx) => (
                          <label key={idx} className={`option ${currentAnswers[globalIndex] === q.options[key] ? 'selected' : ''}`}>
                            <input
                              type="radio"
                              name={`q${globalIndex}`}
                              value={q.options[key]}
                              checked={currentAnswers[globalIndex] === q.options[key]}
                              onChange={() => handleSelect(globalIndex, q.options[key])}
                            />
                            {key}. {q.options[key]}
                          </label>
                        ))}
                      </div>
                      {submitted && (
                        <div className={`feedback ${currentAnswers[globalIndex] === q.options[q.answer] ? 'correct' : 'incorrect'}`}>
                          Đáp án đúng: <strong>{q.answer}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )))
          }
          {currentAnswers.length > 0 && (
            <button className="submit-btn" onClick={handleSubmit}>NỘP BÀI</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeRead;
