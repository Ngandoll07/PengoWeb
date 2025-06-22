import React, { useState, useEffect } from 'react';
import './PracticeRead.css';
import { useNavigate, useLocation } from 'react-router-dom';

const PracticeRead = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showAnswers = location.state?.showAnswers || false;
  const storedAnswers = location.state?.result?.answersByPart;
  const storedFeedback =
    location.state?.result?.aiFeedback ||
    location.state?.stateToPassBack?.aiFeedback || [];

  const [aiFeedback, setAiFeedback] = useState(storedFeedback);
  const [questionsByPart, setQuestionsByPart] = useState({ 5: [], 6: [], 7: [] });
  const [answersByPart, setAnswersByPart] = useState({ 5: [], 6: [], 7: [] });
  const [submitted, setSubmitted] = useState(showAnswers);
  const [activePart, setActivePart] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scoreResult, setScoreResult] = useState({}); // ✅ sửa null → {}

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

        const res7 = await fetch("http://localhost:5000/api/reading-tests/part/7");
        const blocks7 = await res7.json();

        setQuestionsByPart({ 5: formatted5, 6: blocks6, 7: blocks7 });

        const countQuestions = arr => arr.reduce?.((acc, block) => acc + block.questions.length, 0) || arr.length;

        setAnswersByPart({
          5: storedAnswers?.[5] || Array(formatted5.length).fill(null),
          6: storedAnswers?.[6] || Array(countQuestions(blocks6)).fill(null),
          7: storedAnswers?.[7] || Array(countQuestions(blocks7)).fill(null)
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

  const handleSubmit = async () => {
    setSubmitted(true);
    const resultByPart = {};
    let totalCorrect = 0;
    let totalSkipped = 0;
    let totalQuestions = 0;
    const feedbackTemp = [];

    try {
      for (const part of [5]) {
        const questionsToSend = questionsByPart[part].map((q) => ({
          question: q.question,
          options: q.options,
          answer: q.answer
        }));

        const answers = answersByPart[part];

        const res = await fetch('http://localhost:5000/api/reading/score-reading-part', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ part, questions: questionsToSend, answers })
        });

        const partResult = await res.json();
        resultByPart[`part${part}`] = partResult;
        setScoreResult(prev => ({ ...prev, [`part${part}`]: partResult }));

        totalCorrect += partResult.correct;
        totalSkipped += partResult.skipped;
        totalQuestions += partResult.total;

        if (partResult.feedback) {
          feedbackTemp.push(...partResult.feedback); // ✅ FIXED
        }
      }

      const result = {
        correct: totalCorrect,
        incorrect: totalQuestions - totalCorrect - totalSkipped,
        skipped: totalSkipped,
        answered: totalQuestions - totalSkipped,
        total: totalQuestions,
        score: totalCorrect * 5,
        accuracy: Math.round((totalCorrect / totalQuestions) * 100),
        time: formatTime(elapsedTime),
        answersByPart,
        aiFeedback: feedbackTemp
      };

      setAiFeedback(feedbackTemp);

      navigate("/result", {
        state: {
          result,
          sourcePage: "/practiceread",
          scoreResult: resultByPart,
          stateToPassBack: {
            showAnswers: true,
            result,
            aiFeedback: feedbackTemp
          }
        }
      });
    } catch (err) {
      console.error("❌ Lỗi khi gọi AI chấm điểm:", err);
    }
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
              {submitted && aiFeedback.length > 0 && (
  <div className="ai-explanation">
    ✅ <strong>Đáp án đúng:</strong> {aiFeedback.find(f => f.index === i + 1)?.correctAnswer || "?"} <br />
    🧠 <strong>Giải thích:</strong> {aiFeedback.find(f => f.index === i + 1)?.comment || "Không có giải thích."}
  </div>
)}

            </div>
          )))}
          {currentAnswers.length > 0 && (
            <button className="submit-btn" onClick={handleSubmit}>NỘP BÀI</button>
          )}
          {scoreResult && (
            <div className="score-summary">
              <h3>Kết quả chấm từng phần:</h3>
              {['part5', 'part6', 'part7'].map((partKey) => (
                <div key={partKey}>
                  <strong>{partKey.toUpperCase()}</strong>: {scoreResult[partKey]?.correct || 0}/{scoreResult[partKey]?.total || 0} đúng
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeRead;
