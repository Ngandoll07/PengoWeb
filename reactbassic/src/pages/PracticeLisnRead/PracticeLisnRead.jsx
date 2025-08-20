// src/pages/PracticeLisnRead/PracticeLisnRead.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // <-- thêm
import "./PracticeLisnRead.css";

const partList = ["Part 1", "Part 2", "Part 3", "Part 4", "Part 5", "Part 6", "Part 7"];

export default function PracticeLisnRead() {
  const navigate = useNavigate(); // <-- thêm
  const [listeningQuestions, setListeningQuestions] = useState([]);
  const [readingQuestions, setReadingQuestions] = useState([]);
  const [activePart, setActivePart] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [resultSummary, setResultSummary] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [showResultPopup, setShowResultPopup] = useState(false);
  const questionRefs = useRef({});

  const TOTAL_TIME = 60 * 60; // 1 giờ
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef(null);

  // ===== Target & duration =====
  const [targetScore, setTargetScore] = useState("");
  const [studyDuration, setStudyDuration] = useState("");

  // ===== AI StudyPlan =====
  const [studyPlan, setStudyPlan] = useState([]);
  const [analysis, setAnalysis] = useState("");

  // ===== Fetch questions từ DB =====
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/upload-excel-reading/lisnread-tests");
        const data = res.data || [];
        setListeningQuestions(data.filter(q => q.part >= 1 && q.part <= 4));
        setReadingQuestions(data.filter(q => q.part >= 5 && q.part <= 7));
      } catch (err) {
        console.error("Lỗi tải dữ liệu từ DB:", err);
      }
    };
    fetchQuestions();
  }, []);

  // ===== Timer =====
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const allQuestions = [...listeningQuestions, ...readingQuestions];
  const questionIndexMap = {};
  allQuestions.forEach((q, idx) => {
    questionIndexMap[q.questionId] = idx + 1;
  });

  const getQuestionsByPart = () => {
    const all = activePart <= 4 ? listeningQuestions : readingQuestions;
    return all.filter(q => parseInt(q.part) === activePart);
  };
  const questionsByPartForRender = getQuestionsByPart();

  const handleClickQuestion = (questionId) => {
    setSelectedQuestion(questionId);
    const target = questionRefs.current[questionId];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const renderOptions = (questionId, optionsArray) => {
    if (!optionsArray) return null;
    return (
      <div className="option-list">
        {optionsArray.map((text, idx) => {
          const key = String.fromCharCode(65 + idx);
          return (
            <div
              key={key}
              className={`option-item ${selectedAnswers[questionId] === key ? "selected" : ""}`}
              onClick={() => setSelectedAnswers(prev => ({ ...prev, [questionId]: key }))}
            >
              <strong>{key}. </strong>{text}
            </div>
          );
        })}
      </div>
    );
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSelectedQuestion(null);
    setResultSummary(null);
    setFeedbackMap({});
    setTimeLeft(TOTAL_TIME);
    setTargetScore("");
    setStudyDuration("");
  };

  const computeToeicScore = (correctCount, totalCount) => Math.round((correctCount / totalCount) * 495);

  // ===== Nộp bài & gửi AI =====
  const handleSubmitScore = async () => {
    // 1. Tính điểm
    const feedbackTemp = allQuestions.map(q => ({
      id: q.questionId,
      part: q.part,
      userAnswer: selectedAnswers[q.questionId] || null,
      correctAnswer: q.answerAdmin || "A",
      correct: selectedAnswers[q.questionId] === q.answerAdmin
    }));

    const totalCorrect = feedbackTemp.filter(f => f.correct).length;
    const listeningCorrect = feedbackTemp.filter(f => f.correct && f.part >= 1 && f.part <= 4).length;
    const readingCorrect = feedbackTemp.filter(f => f.correct && f.part >= 5 && f.part <= 7).length;

    const listeningScore = computeToeicScore(listeningCorrect, 100);
    const readingScore = computeToeicScore(readingCorrect, 100);

    setFeedbackMap(Object.fromEntries(feedbackTemp.map(f => [f.id, f])));
    setResultSummary({
      correct: totalCorrect,
      incorrect: feedbackTemp.filter(f => !f.correct && f.userAnswer).length,
      skipped: feedbackTemp.filter(f => !f.userAnswer).length,
      total: feedbackTemp.length,
      listeningScore,
      readingScore,
      totalScore: listeningScore + readingScore
    });
    setShowResultPopup(true);

    // 2. Gửi dữ liệu lên AI để phân tích + lưu StudyPlan
    if (targetScore && studyDuration) {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Chưa login");

        const res = await axios.post(
          "http://localhost:5000/api/recommend",
          { listeningScore, readingScore, targetScore, studyDuration },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { suggestion, analysis } = res.data;

        // Lưu vào state
        setStudyPlan(suggestion);
        setAnalysis(analysis);

        // Chuyển hướng tới Roadmap.jsx
        navigate("/roadmap");

      } catch (err) {
        if (err.response?.status === 401) alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
        else console.error("❌ Lỗi gửi AI:", err);
      }
    }
  };

  return (
    <div className="toeic-page">
      <h1 className="page-title">Luyện tập TOEIC Listening & Reading</h1>

      {/* Form nhập mục tiêu */}
      <div className="target-form">
        <h3>Nhập mục tiêu luyện thi</h3>
        <div className="form-group">
          <label>Mục tiêu điểm TOEIC:</label>
          <input
            type="number"
            placeholder="VD: 700"
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value ? Number(e.target.value) : "")}
          />
        </div>
        <div className="form-group">
          <label>Thời gian luyện thi (số tuần):</label>
          <input
            type="number"
            placeholder="VD: 4"
            value={studyDuration}
            onChange={(e) => setStudyDuration(e.target.value ? Number(e.target.value) : "")}
          />
        </div>
      </div>

      <div className="toeic-page1">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="score-button" onClick={handleSubmitScore}>Chấm điểm</button>
            <span className="timer">{formatTime(timeLeft)}</span>
            <button className="reset-button" onClick={handleReset}>Làm lại</button>
          </div>

          <div className="part-tabs">
            {partList.map((part, idx) => (
              <button
                key={part}
                className={`part-tab ${activePart === idx + 1 ? 'active' : ''}`}
                onClick={() => { setActivePart(idx + 1); setSelectedQuestion(null); }}
              >
                {part}
              </button>
            ))}
          </div>

          <div className="question-grid">
            {questionsByPartForRender.map(q => (
              <button
                key={q.questionId}
                className={`question-number ${selectedQuestion === q.questionId ? "selected" : ""} ${selectedAnswers[q.questionId] ? "answered" : ""}`}
                onClick={() => handleClickQuestion(q.questionId)}
              >
                {questionIndexMap[q.questionId]}
              </button>
            ))}
          </div>
        </div>

      <div className="content-area">
  <h2>{partList[activePart - 1]}</h2>

  {questionsByPartForRender.map(q => (
    <div
      key={q.questionId}
      ref={el => questionRefs.current[q.questionId] = el}
      className="question-block"
    >
      <h4>Câu {questionIndexMap[q.questionId]}</h4>

      {/* 📌 Passage cho Part 6 / 7 */}
      {q.passage && (
        <div className="passage">
          <strong>Passage:</strong>
          <p>{q.passage}</p>
        </div>
      )}

      {q.audioPath && <audio controls><source src={q.audioPath} type="audio/mp3" /></audio>}
      {q.imagePath && <img src={q.imagePath} alt={`Câu ${questionIndexMap[q.questionId]}`} className="question-image" />}

      <p>{q.questionText}</p>

      {renderOptions(q.questionId, q.options)}

      {feedbackMap[q.questionId] && (
        <div className="question-feedback">
          <div className="ai-feedback">
            <p><strong>Đáp án đúng:</strong> {feedbackMap[q.questionId].correctAnswer}</p>
            <p><strong>Kết quả:</strong> {feedbackMap[q.questionId].correct ? "✅ Đúng" : "❌ Sai"}</p>
          </div>
          <p><strong>Label:</strong> {q.label}</p>
          {q.part >= 1 && q.part <= 4 && q.transcript && (
            <div className="transcript">
              <p><strong>Transcript:</strong> {q.transcript}</p>
            </div>
          )}
          {q.explanation && (
            <div className="explanation">
              <strong>Explanation:</strong>
              <p>{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  ))}
</div>

      </div>

      {showResultPopup && resultSummary && (
        <div className="goal-popup-overlay">
          <div className="goal-popup-box">
            <h3>Kết quả bài làm</h3>
            <p>✅ Số câu đúng: {resultSummary.correct} câu</p>
            <p>❌ Số câu sai: {resultSummary.incorrect} câu</p>
            <p>⏳ Số câu bỏ qua: {resultSummary.skipped} câu</p>
            <p>Tổng câu: {resultSummary.total}</p>
            <p>🎧 Listening: {resultSummary.listeningScore} / 495</p>
            <p>📖 Reading: {resultSummary.readingScore} / 495</p>
            <p>🏆 Tổng điểm TOEIC: {resultSummary.totalScore} / 990</p>
            <button onClick={() => setShowResultPopup(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
