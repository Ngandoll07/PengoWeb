import React from "react";
import "./ResultPage.css";
import { FaCheckCircle, FaTimesCircle, FaFlag } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const ResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;
  console.log("🧠 Result AI Feedback:", result?.aiFeedback);

  const sourcePage = location.state?.sourcePage;
  const stateToPassBack = location.state?.stateToPassBack;

  if (!result) {
    return <p>❌ Không có dữ liệu kết quả.</p>;
  }

  const handleViewAnswers = () => {
    if (!sourcePage || !stateToPassBack) {
      alert("Không thể xem lại bài làm.");
      return;
    }

    navigate(sourcePage, {
      state: {
        ...stateToPassBack,
        result: {
          ...stateToPassBack.result,
          aiFeedback: result.aiFeedback
        }
      }
    });
  };

  const safeValue = (value) => (isNaN(value) || value === undefined ? 0 : value);

  // 👉 Tính toán lại số liệu từ aiFeedback
const computeStats = (feedback) => {
  const total = feedback?.length || 0;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  feedback?.forEach((f) => {
    const ua = f.userAnswer?.toLowerCase()?.trim();
    const isSkipped = !ua || ua === "không chọn" || ua === "none" || ua === "not chosen";

    if (isSkipped) {
      skipped++;
    } else if (f.correct) {
      correct++;
    } else {
      incorrect++;
    }
  });

  const answered = correct + incorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const score = correct * 5; // bạn có thể tùy chỉnh cách tính điểm

  return { total, correct, incorrect, skipped, answered, accuracy, score };
};


  const stats = computeStats(result.aiFeedback);

  const partTitle = "TOEIC Reading";

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
              {safeValue(stats.answered)}/{safeValue(stats.total)} câu
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-label">⏱️ Thời gian:</span>
            <span className="summary-value">{result.time || "00:00:00"}</span>
          </div>

          <div className="summary-row">
            <span className="summary-label">🎯 Độ chính xác:</span>
            <span className="summary-value">{safeValue(stats.accuracy)}%</span>
          </div>
        </div>

        <div className="summary-cards-grid">
          <div className="card correct">
            <FaCheckCircle className="icon" />
            <p className="label">Đúng</p>
            <h2>{safeValue(stats.correct)}</h2>
          </div>
          <div className="card incorrect">
            <FaTimesCircle className="icon" />
            <p className="label">Sai</p>
            <h2>{safeValue(stats.incorrect)}</h2>
          </div>
          <div className="card skipped">
            <span className="icon">➖</span>
            <p className="label">Bỏ qua</p>
            <h2>{safeValue(stats.skipped)}</h2>
          </div>
          <div className="card score">
            <FaFlag className="icon" />
            <p className="label">Tổng điểm</p>
            <h2>{safeValue(stats.score)}</h2>
          </div>
        </div>
      </div>

      {result.listeningScore && result.readingScore && (
        <div className="score-section">
          <div className="score-box">
            <h3>🎧 Listening</h3>
            <p className="score">{safeValue(result.listeningScore)}/495</p>
            <p className="sub-info">
              Trả lời đúng: {safeValue(result.listeningCorrect)}/100
            </p>
          </div>
          <div className="score-box">
            <h3>📖 Reading</h3>
            <p className="score">{safeValue(result.readingScore)}/495</p>
            <p className="sub-info">
              Trả lời đúng: {safeValue(result.readingCorrect)}/100
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;
