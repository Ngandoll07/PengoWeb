import React from "react";
import "./ResultPage.css";
import { FaCheckCircle, FaTimesCircle, FaFlag } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state || {};

const handleViewAnswers = () => {
  navigate(`/practicelesson/${result.lessonId}`, {
    state: {
      showAnswers: true,
      answers: result.answers,
    },
  });
};



  // Xác định tiêu đề dựa trên phần đã làm
  const parts = result.partsSubmitted || [];
  const partTitle =
    parts.length === 3
      ? "TOEIC Reading"
      : parts.length === 1
      ? `Part ${parts[0]}`
      : parts.map(p => `Part ${p}`).join(", ");

  return (
    <div className="result-container">
      <h1 className="result-title">📘 Kết quả thi: {partTitle}</h1>

      <div className="result-header-buttons">
        <button className="btn view-answers" onClick={handleViewAnswers}>
          📄 Xem đáp án
        </button>
        <button className="btn back-test" onClick={() => navigate("/practice")}>
          🔙 Quay lại đề thi
        </button>
      </div>

      <div className="result-main">
        <div className="summary-card">
          <h2 className="summary-title">📊 Tổng Quan</h2>

          <div className="summary-row">
            <span className="summary-label">📝 Câu đã làm:</span>
            <span className="summary-value">
              {result.correct}/{result.total} câu
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-label">⏱️ Thời gian:</span>
            <span className="summary-value">{result.time}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">🎯 Độ chính xác:</span>
            <span className="summary-value">{result.accuracy}%</span>
          </div>
        </div>

        <div className="summary-cards-grid">
          <div className="card correct">
            <FaCheckCircle className="icon" />
            <p className="label">Đúng</p>
            <h2>{result.correct}</h2>
          </div>
          <div className="card incorrect">
            <FaTimesCircle className="icon" />
            <p className="label">Sai</p>
            <h2>{result.incorrect}</h2>
          </div>
          <div className="card skipped">
            <span className="icon">➖</span>
            <p className="label">Bỏ qua</p>
            <h2>{result.skipped}</h2>
          </div>
          <div className="card score">
            <FaFlag className="icon" />
            <p className="label">Tổng điểm</p>
            <h2>{result.score}</h2>
          </div>
        </div>
      </div>

      {result.listeningScore && result.readingScore && (
        <div className="score-section">
          <div className="score-box">
            <h3>🎧 Listening</h3>
            <p className="score">{result.listeningScore}/495</p>
            <p className="sub-info">Trả lời đúng: {result.listeningCorrect}/100</p>
          </div>
          <div className="score-box">
            <h3>📖 Reading</h3>
            <p className="score">{result.readingScore}/495</p>
            <p className="sub-info">Trả lời đúng: {result.readingCorrect}/100</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;