import React, { useState, useEffect } from 'react';
import './PracticeRead.css';
import { useNavigate, useLocation } from 'react-router-dom';

const PracticeRead = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showAnswers = location.state?.showAnswers || false;
  const storedAnswers = location.state?.result?.answersByPart;
  const storedFeedback = location.state?.result?.aiFeedback || location.state?.stateToPassBack?.aiFeedback || [];

  const [aiFeedback, setAiFeedback] = useState(storedFeedback);
  const [questionsByPart, setQuestionsByPart] = useState({ 5: [], 6: [], 7: [] });
  const [answersByPart, setAnswersByPart] = useState({ 5: [], 6: [], 7: [] });
  const [submitted, setSubmitted] = useState(showAnswers);
  const [activePart, setActivePart] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedbackByPart, setFeedbackByPart] = useState({ 5: [], 6: [], 7: [] });

  const fetchData = async () => {
    try {
      const [res5, res6, res7] = await Promise.all([
        fetch('http://localhost:5000/api/reading-tests/part/5'),
        fetch('http://localhost:5000/api/reading-tests/part/6'),
        fetch('http://localhost:5000/api/reading-tests/part/7')
      ]);

      const data5 = await res5.json();
      const blocks6 = await res6.json();
      const blocks7 = await res7.json();

      const formatted5 = data5.map(q => ({
        question: q.question,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        answer: q.answer
      }));

      const countQuestions = arr => arr.reduce((acc, block) => acc + block.questions.length, 0);

      setQuestionsByPart({ 5: formatted5, 6: blocks6, 7: blocks7 });
      setAnswersByPart({
        5: storedAnswers?.[5] || Array(formatted5.length).fill(null),
        6: storedAnswers?.[6] || Array(countQuestions(blocks6)).fill(null),
        7: storedAnswers?.[7] || Array(countQuestions(blocks7)).fill(null)
      });
    } catch (err) {
      console.error('❌ Lỗi tải dữ liệu:', err);
    }
  };

  useEffect(() => {
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

  const handleReset = () => {
    const length = activePart === 5
      ? questionsByPart[5].length
      : questionsByPart[activePart]?.reduce((acc, block) => acc + block.questions.length, 0);
    setAnswersByPart(prev => ({ ...prev, [activePart]: Array(length).fill(null) }));
    setSubmitted(false);
    setElapsedTime(0);
  };

  const getGlobalIndexOffset = (part) => {
    const count5 = questionsByPart[5]?.length || 0;
    const count6 = questionsByPart[6]?.reduce((acc, block) => acc + block.questions.length, 0) || 0;
    if (part === 6) return count5;
    if (part === 7) return count5 + count6;
    return 0;
  };

 const handleSubmit = async () => {
  setSubmitted(true);
  const resultByPart = {};
  let totalCorrect = 0;
  let totalSkipped = 0;
  let totalQuestions = 0;
  const feedbackTemp = [];

  try {
    for (const part of [5, 6, 7]) {
      const partKey = `part${part}`;
      resultByPart[partKey] = { correct: 0, skipped: 0, total: 0, feedback: [] };

      if (part === 5) {
        // Gửi toàn bộ câu hỏi Part 5 trong 1 request
        const formattedQuestions = questionsByPart[5].map(q => ({
          question: q.question.trim(),
          options: [q.options.A, q.options.B, q.options.C, q.options.D],
          answer: q.answer
        }));

        const response = await fetch('http://localhost:5000/api/reading/score-reading-part', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            part: 5,
            questions: formattedQuestions,
            answers: answersByPart[5] ?? []
          })
        });

        const result = await response.json();
        resultByPart[partKey].correct += result.correct;
        resultByPart[partKey].skipped += result.skipped;
        resultByPart[partKey].total += result.total;

        if (result.feedback) {
          const enriched = result.feedback.map((fb, idx) => ({
            ...fb,
            part,
            globalIndex: getGlobalIndexOffset(part) + idx
          }));
          resultByPart[partKey].feedback.push(...enriched);
          feedbackTemp.push(...enriched);
        }

        totalCorrect += result.correct;
        totalSkipped += result.skipped;
        totalQuestions += result.total;
      } 
      else {
        // Giữ nguyên logic Part 6 & 7
        const blocks = questionsByPart[part];
        let globalIndex = 0;

        for (const block of blocks) {
          const passage = block.passage || '';

          for (let i = 0; i < block.questions.length; i++) {
            const q = block.questions[i];
            const globalIdx = getGlobalIndexOffset(part) + globalIndex;

            const response = await fetch('http://localhost:5000/api/reading/score-reading-part', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                part,
                questions: [{
                  question: `${passage}\n${q.question}`.trim(),
                  options: [q.options.A, q.options.B, q.options.C, q.options.D],
                  answer: q.answer
                }],
                answers: [answersByPart[part]?.[globalIndex] ?? 'Không chọn']
              })
            });

            const result = await response.json();
            resultByPart[partKey].correct += result.correct;
            resultByPart[partKey].skipped += result.skipped;
            resultByPart[partKey].total += result.total;

            if (result.feedback) {
              const enriched = result.feedback.map(fb => ({
                ...fb,
                part,
                globalIndex: globalIdx
              }));
              resultByPart[partKey].feedback.push(...enriched);
              feedbackTemp.push(...enriched);
            }

            totalCorrect += result.correct;
            totalSkipped += result.skipped;
            totalQuestions += result.total;
            globalIndex++;

            // Delay giữa mỗi câu
            await new Promise(res => setTimeout(res, part === 6 ? 8000 : 15000));
          }
        }
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

    const groupedFeedback = { 5: [], 6: [], 7: [] };
    feedbackTemp.forEach(fb => {
      if ([5, 6, 7].includes(fb.part)) groupedFeedback[fb.part].push(fb);
    });

    setAiFeedback(feedbackTemp);
    setFeedbackByPart(groupedFeedback);

    navigate('/result', {
      state: {
        result,
        sourcePage: '/practiceread',
        scoreResult: resultByPart,
        stateToPassBack: {
          showAnswers: true,
          result,
          aiFeedback: feedbackTemp
        }
      }
    });
  } catch (err) {
    console.error('❌ Lỗi khi gọi AI chấm điểm:', err);
  }
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
      🏷️ <strong>Nhóm lỗi:</strong> {aiFeedback.find(f => f.index === i + 1)?.label || "Không xác định"}
  </div>
)}


              </div>
            )))}
           {activePart === 6 && questionsByPart[6].map((block, blockIndex) => (
  <div className="question-block" key={blockIndex}>
    <p className="passage">{block.passage}</p>

    {block.questions.map((q, i) => {
      const globalIndex = questionsByPart[6]
        .slice(0, blockIndex)
        .reduce((acc, b) => acc + b.questions.length, 0) + i;

   const partStartIndex = {
  5: 0,
  6: questionsByPart[5]?.length || 0,
  7: (questionsByPart[5]?.length || 0) + 
     (questionsByPart[6]?.reduce((acc, block) => acc + block.questions.length, 0) || 0)
};


   const feedback = aiFeedback.find(
 f => f.globalIndex === partStartIndex[activePart] + globalIndex
);


      return (
        <div key={globalIndex} id={`q${globalIndex}`}>
          <h4>Câu {globalIndex + 1}</h4>
          <p className="question">{q.question}</p>

          <div className="options">
            {Object.entries(q.options).map(([key, opt]) => (
              <label
                key={key}
                className={`option ${answersByPart[6]?.[globalIndex] === opt ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`q${globalIndex}`}
                  value={opt}
                  checked={answersByPart[6]?.[globalIndex] === opt}
                  onChange={() => handleSelect(globalIndex, opt)}
                />
                {opt}
              </label>
            ))}
          </div>

          {submitted && feedback && (
            <div className="ai-explanation">
                <p><strong>Đáp án đúng:</strong> {feedback?.correctAnswer || "Chưa chấm"}</p>
    <p><strong>Đáp án của bạn:</strong> {feedback?.userAnswer || "Chưa chọn"}</p>
    <p><strong>Giải thích:</strong> {feedback?.comment || "Đang chờ AI chấm"}</p>
        <p><strong>Nhóm lỗi:</strong> {feedback?.label || "Không xác định"}</p>
            </div>
          )}
        </div>
      );
    })}
  </div>
))}

  {activePart === 7 && questionsByPart[7].map((block, blockIndex) => (
    <div className="question-block" key={blockIndex}>
      <p className="passage">{block.passage}</p>
      {block.questions.map((q, i) => {
        const globalIndex = questionsByPart[7]
          .slice(0, blockIndex)
          .reduce((acc, b) => acc + b.questions.length, 0) + i;
           // 🔧 Thêm đoạn này vào:
     const partStartIndex = {
  5: 0,
  6: questionsByPart[5]?.length || 0,
  7: (questionsByPart[5]?.length || 0) + 
     (questionsByPart[6]?.reduce((acc, block) => acc + block.questions.length, 0) || 0)
};

       const feedback = aiFeedback.find(
  f => f.globalIndex === partStartIndex[7] + globalIndex
      );
        return (
          <div key={globalIndex} id={`q${globalIndex}`}>
            <h4>Câu {globalIndex + 1}</h4>
              <p className="question">{q.question}</p> {/* ✅ THÊM DÒNG NÀY */}
            <div className="options">
              {Object.entries(q.options).map(([key, opt]) => (
                <label key={key} className={`option ${answersByPart[7]?.[globalIndex] === opt ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`q${globalIndex}`}
                    value={opt}
                    checked={answersByPart[7]?.[globalIndex] === opt}
                    onChange={() => handleSelect(globalIndex, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {submitted && feedback && (
            <div className="ai-explanation">
                <p><strong>Đáp án đúng:</strong> {feedback?.correctAnswer || "Chưa chấm"}</p>
    <p><strong>Đáp án của bạn:</strong> {feedback?.userAnswer || "Chưa chọn"}</p>
    <p><strong>Giải thích:</strong> {feedback?.comment || "Đang chờ AI chấm"}</p>
    <p><strong>Nhóm lỗi:</strong> {feedback?.label || "Không xác định"}</p>
            </div>
          )}

          </div>
        );
      })}
    </div>
  ))}

            {currentAnswers.length > 0 && (
              <button className="submit-btn" onClick={handleSubmit}>NỘP BÀI</button>
            )}
          </div>
        </div>
      </div>
    );
};

export default PracticeRead;
