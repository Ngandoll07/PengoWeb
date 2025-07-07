import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PracticeLessonPage.css";

const PracticeLessonPage = () => {
  const { state } = useLocation();
  const { lesson, day, roadmapItemId } = state || {}; // nhận roadmapItemId để cập nhật trạng thái
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const handleSelect = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

const handleSubmit = async () => {
  const processedQuestions = lesson.questions.map((q, i) => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.answer,
    userAnswer: answers[i] || null,
  }));

  const payload = {
    day: day || 1,
    skill: lesson.skill || "listening",
    part: lesson.part || 1,
    level: lesson.level || "easy",
    questions: processedQuestions,
  };

  try {
    // Gọi AI chấm điểm
    const res = await axios.post("http://localhost:5000/api/grade-lesson", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const { correct, total, feedback } = res.data;
    const progress = Math.round((correct / total) * 100);

    // ✅ Gọi API lưu kết quả vào database
    await axios.post("http://localhost:5000/api/submit-day-result", {
      day: day || 1,
      skill: lesson.skill || "listening",
      part: lesson.part || 1,
      level: lesson.level || "easy",
      totalQuestions: total,
      correct,
      averageTime: 1,
      mistakes: feedback.filter(f => !f.isCorrect).map(f => f.mistakeType || "unknown"),
      answers: feedback,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    // ✅ Cập nhật roadmap nếu có
    if (roadmapItemId) {
      await axios.put(`http://localhost:5000/api/roadmap/${roadmapItemId}`, {
        progress,
        status: "done",
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    }

    setSubmitted(true);
    setResult({ correct, total, feedback });
  } catch (err) {
    alert("❌ Lỗi khi nộp bài hoặc lưu kết quả.");
    console.error(err);
  }
};


  return (
    <div className="lesson-container">
      <h2>{lesson.title}</h2>
      <p>{lesson.description}</p>

      {lesson.questions.map((q, index) => (
        <div key={index} className="question-block">
          <p><strong>Câu {index + 1}:</strong> {q.question}</p>
          {q.options.map((opt, i) => (
            <label key={i} className="option-label">
              <input
                type="radio"
                name={`question-${index}`}
                value={opt}
                checked={answers[index] === opt}
                onChange={() => handleSelect(index, opt)}
                disabled={submitted}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      {!submitted && (
        <button onClick={handleSubmit} className="submit-button">
          ✅ Nộp bài
        </button>
      )}

    {submitted && result && (
  <div className="result-summary">
    <h4>Kết quả: {result.correct}/{result.total} đúng</h4>
    <ul>
      {result.feedback?.map((item, i) => (
        <li key={i}>
          Câu {item.index}: {item.isCorrect ? "✅ Đúng" : `❌ Sai`} — {item.mistakeType || "unknown"}
        </li>
      ))}
    </ul>
    <button onClick={() => navigate("/roadmap")}>➡️ Quay về lộ trình</button>
  </div>
)}

    </div>
  );
};

export default PracticeLessonPage;