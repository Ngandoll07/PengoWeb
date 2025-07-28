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
  const [feedbackByPart, setFeedbackByPart] = useState({ 5: [], 6: [], 7: [] });
const level = location.state?.level || "medium"; // 👈 Lấy level từ state
  

  useEffect(() => {
  const fetchData = async () => {
    try {
      const res5 = await fetch(`http://localhost:5000/api/reading-tests/part/5?level=${level}`);
      const data5 = await res5.json();
      const formatted5 = data5.map(q => ({
        question: q.question,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        answer: q.answer
      }));

      const res6 = await fetch(`http://localhost:5000/api/reading-tests/part/6?level=${level}`);
      const blocks6 = await res6.json();

      const res7 = await fetch(`http://localhost:5000/api/reading-tests/part/7?level=${level}`);
      const blocks7 = await res7.json();

      const countQuestions = arr => arr.reduce?.((acc, block) => acc + block.questions.length, 0) || arr.length;

      setQuestionsByPart({ 5: formatted5, 6: blocks6, 7: blocks7 });
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
}, [storedAnswers]);

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
  if (part === 5) return 0;
  if (part === 6) return questionsByPart[5]?.length || 0;
  if (part === 7) {
    const countPart5 = questionsByPart[5]?.length || 0;
    const countPart6 = questionsByPart[6]?.reduce((acc, block) => acc + block.questions.length, 0) || 0;
    return countPart5 + countPart6;
  }
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
      if (part === 5) {
  const questions = questionsByPart[5].map((q, i) => ({
    question: q.question,
    options: q.options, // hoặc chuyển về { A, B, C, D } nếu backend cần
    answer: q.answer // nếu cần
  }));

  const answers = questionsByPart[5].map((_, i) =>
    answersByPart[5]?.[i] ?? "Không chọn"
  );

  const res = await fetch("http://localhost:5000/api/reading/score-reading-part", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      part,
      questions,
      answers
    })
  });

  const result = await res.json();
  resultByPart.part5 = result;
  totalCorrect += result.correct;
  totalSkipped += result.skipped;
  totalQuestions += result.total;

  if (result.feedback) {
    const enriched = result.feedback.map((fb, i) => ({
      ...fb,
      part,
      globalIndex: i
    }));
    feedbackTemp.push(...enriched);
  }

  await new Promise(res => setTimeout(res, 1000));
}


      if (part === 6 || part === 7) {
        const blocks = questionsByPart[part];
        const partKey = `part${part}`;
        resultByPart[partKey] = { correct: 0, skipped: 0, total: 0, feedback: [] };

        let globalIndex = 0;

        for (const block of blocks) {
          const questions = block.questions.map((q, i) => {
            const globalIdx = getGlobalIndexOffset(part) + globalIndex + i;
            return {
              globalIndex: globalIdx,
              question: `${block.passage}\n${q.question}`,
              options: [q.options.A, q.options.B, q.options.C, q.options.D],
              answer: q.answer
            };
          });

          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            const res = await fetch("http://localhost:5000/api/reading/score-reading-part", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                part,
                questions: [{ question: q.question, options: q.options, answer: q.answer }],
                answers: [answersByPart[part]?.[globalIndex] ?? "Không chọn"]
              })
            });

            const result = await res.json();

            resultByPart[partKey].correct += result.correct;
            resultByPart[partKey].skipped += result.skipped;
            resultByPart[partKey].total += result.total;
            resultByPart[partKey].feedback.push(...(result.feedback || []));

            if (result.feedback) {
              const enriched = result.feedback.map(fb => ({
                ...fb,
                part,
                globalIndex: q.globalIndex
              }));
              feedbackTemp.push(...enriched);
            }

            totalCorrect += result.correct;
            totalSkipped += result.skipped;
            totalQuestions += result.total;

            await new Promise(res => setTimeout(res, part === 6 ? 8000 : 15000));
          }

          globalIndex += block.questions.length;
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
      if ([5, 6, 7].includes(fb.part)) {
        groupedFeedback[fb.part].push(fb);
      }
    });

    setAiFeedback(feedbackTemp);
    setFeedbackByPart(groupedFeedback);

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
           {activePart === 6 && questionsByPart[6].map((block, blockIndex) => (
  <div className="question-block" key={blockIndex}>
    <p className="passage">{block.passage}</p>

    {block.questions.map((q, i) => {
      const globalIndex = questionsByPart[6]
        .slice(0, blockIndex)
        .reduce((acc, b) => acc + b.questions.length, 0) + i;

      const partStartIndex = {
        5: 0,
        6: 30, // số câu Part 5
        7: 46, // số câu Part 5 + Part 6
      };

   const feedback = aiFeedback.find(
  f => f.globalIndex === partStartIndex[6] + globalIndex
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
        6: 30, // số câu của Part 5
        7: 47, // số câu của Part 5 + Part 6
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