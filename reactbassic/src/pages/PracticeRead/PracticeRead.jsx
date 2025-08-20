import React, { useState, useEffect } from 'react';
import './PracticeRead.css';
import { useLocation } from 'react-router-dom';

const PracticeRead = () => {
  const location = useLocation();
  const showAnswers = location.state?.showAnswers || false;

  // Nếu bạn có lưu kết quả ở trang trước thì lấy ra (đặt tên là aiFeedback cho tương thích – chỉ là kết quả chấm, không AI)
  const storedAnswers = location.state?.result?.answersByPart;
  const storedFeedback = location.state?.result?.aiFeedback || [];

  // State
  const [aiFeedback, setAiFeedback] = useState(storedFeedback); // kết quả chấm chi tiết theo từng câu
  const [questionsByPart, setQuestionsByPart] = useState({ 5: [], 6: [], 7: [] });
  const [answersByPart, setAnswersByPart] = useState({ 5: [], 6: [], 7: [] }); // lưu A/B/C/D theo chỉ mục nội bộ từng Part
  const [submitted, setSubmitted] = useState(showAnswers); // true -> hiển thị đáp án
  const [activePart, setActivePart] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [resultSummary, setResultSummary] = useState(null);
  const [showResultPopup, setShowResultPopup] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const [res5, res6, res7] = await Promise.all([
        fetch('http://localhost:5000/api/reading-tests/part/5'),
        fetch('http://localhost:5000/api/reading-tests/part/6'),
        fetch('http://localhost:5000/api/reading-tests/part/7')
      ]);

      const data5 = await res5.json();     // array câu hỏi Part 5
      const blocks6 = await res6.json();   // array block Part 6
      const blocks7 = await res7.json();   // array block Part 7

      // Chuẩn hoá Part 5 về options array và answer là A/B/C/D
      const formatted5 = data5.map(q => ({
        question: q.question,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        answer: q.answer, // "A" | "B" | "C" | "D"
        explanation: q.explanation || "Không có giải thích.",
        label: q.label
      }));

      const countQuestions = (arr) =>
        Array.isArray(arr) ? arr.reduce((acc, block) => acc + (block?.questions?.length || 0), 0) : 0;

      setQuestionsByPart({ 5: formatted5, 6: blocks6, 7: blocks7 });

      // Khởi tạo đáp án rỗng theo số câu thực tế từng Part (giữ lại nếu có storedAnswers)
      setAnswersByPart({
        5: storedAnswers?.[5] || Array(formatted5.length).fill(null),
        6: storedAnswers?.[6] || Array(countQuestions(blocks6)).fill(null),
        7: storedAnswers?.[7] || Array(countQuestions(blocks7)).fill(null)
      });
    } catch (err) {
      console.error('❌ Lỗi tải dữ liệu:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = sec => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Tính offset global theo dữ liệu thực tế: 
  // Part 5: bắt đầu 0, Part 6: sau Part 5, Part 7: sau Part 5 + Part 6
  const getGlobalStart = (part) => {
    const count5 = questionsByPart[5]?.length || 0;
    const count6 = (questionsByPart[6] || []).reduce((acc, b) => acc + (b?.questions?.length || 0), 0);
    if (part === 5) return 0;
    if (part === 6) return count5;
    if (part === 7) return count5 + count6;
    return 0;
  };

  // Chọn đáp án — index là chỉ mục nội bộ theo từng Part (không phải global)
  const handleSelect = (part, localIndex, letter) => {
    if (submitted) return;
    setAnswersByPart(prev => {
      const updated = { ...prev };
      const arr = [...(updated[part] || [])];
      arr[localIndex] = letter; // lưu A/B/C/D
      updated[part] = arr;
      return updated;
    });
  };

  // Làm lại riêng Part đang mở (không ảnh hưởng part khác)
  const handleReset = () => {
    const length =
      activePart === 5
        ? (questionsByPart[5]?.length || 0)
        : (questionsByPart[activePart] || []).reduce((acc, b) => acc + (b?.questions?.length || 0), 0);

    setAnswersByPart(prev => ({ ...prev, [activePart]: Array(length).fill(null) }));
    setSubmitted(false);
    setElapsedTime(0);
    setResultSummary(null);
    setAiFeedback([]);
    setShowResultPopup(false);
  };

  // Chấm điểm: so sánh trực tiếp với answer trong DB, đánh số global 1→100
  const handleSubmit = () => {
    setSubmitted(true);       // để hiện đáp án trên UI
    setShowResultPopup(true); // mở popup kết quả

    let totalCorrect = 0;
    let totalSkipped = 0;
    let totalQuestions = 0;
    const feedbackTemp = [];

    let globalCounter = 1; // đánh số liên tục 1→100

    [5, 6, 7].forEach(part => {
      const qList =
        part === 5
          ? questionsByPart[5]
          : (questionsByPart[part] || []).flatMap(b => b.questions || []);

      qList.forEach((q, localIdx) => {
        const userAns = answersByPart[part]?.[localIdx] || null;
        const isSkipped = !userAns;
        const isCorrect = userAns === q.answer;

        if (isCorrect) totalCorrect++;
        if (isSkipped) totalSkipped++;
        totalQuestions++;

        feedbackTemp.push({
          part,
          globalIndex: globalCounter, // 1..100
          userAnswer: userAns || "Không chọn",
          correctAnswer: q.answer,    // "A"/"B"/"C"/"D"
          correct: isCorrect,
          explanation: q.explanation || "Không có giải thích.",
          label: q.label || `Câu ${globalCounter}`
        });

        globalCounter++;
      });
    });

    setAiFeedback(feedbackTemp);
    setResultSummary({
      correct: totalCorrect,
      incorrect: totalQuestions - totalCorrect - totalSkipped,
      skipped: totalSkipped,
      answered: totalQuestions - totalSkipped,
      total: totalQuestions,
      score: totalCorrect * 5, // mỗi câu đúng 5 điểm (tuỳ bạn quy đổi)
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      time: formatTime(elapsedTime),
      answersByPart,
      aiFeedback: feedbackTemp
    });
  };

  // Render radio options: dùng name theo globalIndex để không va chạm giữa các câu
  const renderOptions = (part, localIndex, options, globalNumber) => {
    return options.map((opt, idx) => {
      const letter = String.fromCharCode(65 + idx); // "A/B/C/D"
      const checked = answersByPart[part]?.[localIndex] === letter;
      return (
        <label key={idx} className={`option ${checked ? 'selected' : ''}`}>
          <input
            type="radio"
            name={`q-${globalNumber}`}        // đảm bảo mỗi câu là 1 group riêng
            value={letter}
            checked={checked}
            onChange={() => handleSelect(part, localIndex, letter)}
          />
          {letter}. {opt}
        </label>
      );
    });
  };

  // Render câu hỏi theo Part với đánh số global
  const renderQuestions = (part) => {
    if (part === 5) {
      const start = getGlobalStart(5); // 0
      return questionsByPart[5].map((q, i) => {
        const globalNumber = start + i + 1; // 1..n
        const fb = aiFeedback.find(f => f.globalIndex === globalNumber);
        const correctLetter = fb?.correctAnswer;
        const userLetter = fb?.userAnswer;

        return (
          <div className="question-block" key={globalNumber} id={`q-${globalNumber}`}>
            <h4 className="number-question">Câu {globalNumber}</h4>
            <p className="question">{q.question}</p>
            <div className="options">{renderOptions(5, i, q.options, globalNumber)}</div>

            {submitted && fb && (
              <div className="ai-explanation">
                <p><strong>Đáp án đúng:</strong> {correctLetter} {typeof correctLetter === 'string' ? `(${q.options[correctLetter.charCodeAt(0)-65]})` : ''}</p>
                <p>
                  <strong>Đáp án của bạn:</strong>{' '}
                  {userLetter && userLetter !== "Không chọn"
                    ? `${userLetter} (${q.options[userLetter.charCodeAt(0)-65]})`
                    : "Không chọn"}
                </p>
                <p><strong>Giải thích:</strong> {q.explanation}</p>
                <p><strong>Nhóm lỗi:</strong> {q.label}</p>
              </div>
            )}
          </div>
        );
      });
    }

    // Part 6 & 7: có block
    const start = getGlobalStart(part);
    return (questionsByPart[part] || []).map((block, blockIndex) => {
      const beforeCount = (questionsByPart[part] || [])
        .slice(0, blockIndex)
        .reduce((acc, b) => acc + (b?.questions?.length || 0), 0);

      return (
        <div className="question-block" key={`p${part}-b${blockIndex}`}>
          {block?.imagePath && (
            <div className="part7-image-gallery">
              {block.imagePath.split(/\r?\n/).map((img, i) => (
                <img
                  key={i}
                  src={img.trim()}
                  alt={`Part ${part} ${blockIndex}-${i}`}
                  className="part7-image"
                />
              ))}
            </div>
          )}
          {block.passage && (
            <div className="passage">
              {block.passage}
            </div>
          )}
          {(block?.questions || []).map((q, i) => {
            const localIndex = beforeCount + i;           // chỉ mục nội bộ Part
            const globalNumber = start + localIndex + 1;  // số câu toàn bài
            const fb = aiFeedback.find(f => f.globalIndex === globalNumber);
            const opts = [q.options?.A, q.options?.B, q.options?.C, q.options?.D];

            const correctLetter = fb?.correctAnswer;
            const userLetter = fb?.userAnswer;

            return (
              <div key={`q-${globalNumber}`} id={`q-${globalNumber}`}>
                <h4 className="number-question">Câu {globalNumber}</h4>
                <p className="question">{q.question}</p>
                <div className="options">{renderOptions(part, localIndex, opts, globalNumber)}</div>

                {submitted && fb && (
                  <div className="ai-explanation">
                    <p><strong>Đáp án đúng:</strong> {correctLetter} {typeof correctLetter === 'string' ? `(${opts[correctLetter.charCodeAt(0)-65]})` : ''}</p>
                    <p>
                      <strong>Đáp án của bạn:</strong>{' '}
                      {userLetter && userLetter !== "Không chọn"
                        ? `${userLetter} (${opts[userLetter.charCodeAt(0)-65]})`
                        : "Không chọn"}
                    </p>
                    <p><strong>Giải thích:</strong> {q.explanation}</p>
                    <p><strong>Nhóm lỗi:</strong> {q.label}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="toeic-container">
      <h1 className="page-title">Luyện đọc TOEIC - Part {activePart}</h1>

      {showResultPopup && resultSummary && (
        <div className="result-popup">
          <div className="result-content">
            <h3>Kết quả bài thi</h3>
            <p>✅ Đúng: {resultSummary.correct}</p>
            <p>❌ Sai: {resultSummary.incorrect}</p>
            <p>⚪ Bỏ qua: {resultSummary.skipped}</p>
            <p>📊 Chính xác: {resultSummary.accuracy}%</p>
            <p>🕒 Thời gian: {resultSummary.time}</p>
            <p>🏆 Điểm: {resultSummary.score}</p>
            {/* Đóng popup nhưng vẫn giữ submitted=true để hiển thị đáp án trong trang */}
            <button className="close-btn" onClick={() => setShowResultPopup(false)}>Đóng</button>
          </div>
        </div>
      )}

      <div className="test-panel">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="score-button" onClick={handleSubmit}>Chấm điểm</button>
            <span className="timer">{formatTime(elapsedTime)}</span>
            <button className="reset-button" onClick={handleReset}>
              <img src="/assets/Undo Arrow.png" className="undo" alt="reset" /> Làm lại
            </button>
          </div>

          <div className="part-tabs">
            {[5, 6, 7].map(part => (
              <button
                key={part}
                className={activePart === part ? 'part-tab active' : 'part-tab'}
                onClick={() => setActivePart(part)}
              >
                Part {part}
              </button>
            ))}
          </div>

          {/* Sidebar question grid — đánh số theo globalIndex, check trạng thái theo localIndex của từng Part */}
          <div className="question-grid">
            {activePart === 5 && questionsByPart[5].map((_, i) => {
              const globalNumber = getGlobalStart(5) + i + 1; // 1..n
              const answered = !!answersByPart[5]?.[i];
              return (
                <button
                  key={`sb-${globalNumber}`}
                  className={answered ? 'answered' : ''}
                  onClick={() => document.getElementById(`q-${globalNumber}`)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {globalNumber}
                </button>
              );
            })}

            {activePart !== 5 &&
              (questionsByPart[activePart] || []).map((block, blockIndex) => {
                const beforeCount = (questionsByPart[activePart] || [])
                  .slice(0, blockIndex)
                  .reduce((acc, b) => acc + (b?.questions?.length || 0), 0);

                return (block?.questions || []).map((_, i) => {
                  const localIndex = beforeCount + i;
                  const globalNumber = getGlobalStart(activePart) + localIndex + 1;
                  const answered = !!answersByPart[activePart]?.[localIndex];
                  return (
                    <button
                      key={`sb-${globalNumber}`}
                      className={answered ? 'answered' : ''}
                      onClick={() => document.getElementById(`q-${globalNumber}`)?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      {globalNumber}
                    </button>
                  );
                });
              })
            }
          </div>
        </div>

        <div className="question-area">
          {renderQuestions(activePart)}
          {(answersByPart[activePart] || []).length > 0 && (
            <button className="submit-btn" onClick={handleSubmit}>NỘP BÀI</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeRead;
