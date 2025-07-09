import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PracticeLessonPage.css";

// ... (giữ nguyên import)

const PracticeLessonPage = () => {
  const { state } = useLocation();
  const { lesson, day, roadmapItemId } = state || {};
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
      questionId: q._id || `q${i + 1}`, // fallback nếu không có id
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
      const res = await axios.post("http://localhost:5000/api/grade-lesson", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const { correct, total, feedback } = res.data;
      const progress = Math.round((correct / total) * 100);

      await axios.post("http://localhost:5000/api/submit-day-result", {
        day: day || 1,
        skill: lesson.skill,
        part: lesson.part,
        level: lesson.level,
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

      // ✅ Cập nhật roadmapItem nếu có
      if (roadmapItemId) {
        console.log("🚀 Cập nhật roadmap item:", roadmapItemId, "Tiến độ:", progress);
        await axios.put(`http://localhost:5000/api/roadmap/${roadmapItemId}`, {
          progress,
          status: "done",
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        console.warn("⚠️ Không có roadmapItemId — không thể cập nhật roadmap");
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
          <button onClick={() => navigate("/roadmap", { state: { updated: true } })}>
            ➡️ Quay về lộ trình
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeLessonPage;