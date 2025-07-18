// PracticeReadingPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PracticeLessonPage.css";

const PracticeReadingPage = () => {
  const { state } = useLocation();
  const { lesson, day, roadmapItemId } = state || {};
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  if (!lesson) return <p>Không có bài học</p>;

  const isBlockBased = lesson.part === 6 || lesson.part === 7;

  const getAllQuestions = () => {
    if (isBlockBased) {
      return lesson.blocks.flatMap((block, blockIdx) =>
        block.questions.map((q) => ({ ...q, block: block }))
      );
    }
    return lesson.questions;
  };

  const allQuestions = getAllQuestions();

  const handleSelect = (qIndex, choice) => {
    if (submitted) return;
    setAnswers({ ...answers, [qIndex]: choice });
  };

  const handleSubmit = async () => {
    let correct = 0;
    allQuestions.forEach((q, index) => {
      if (answers[index] === q.answer) correct++;
    });

    const percent = Math.round((correct / allQuestions.length) * 100);
    setScore(percent);
    setSubmitted(true);

    const userId = localStorage.getItem("userId");

    try {
      await axios.post("http://localhost:5000/api/lesson-result", {
        userId,
        roadmapItemId,
        day,
        skill: lesson.skill,
        part: lesson.part,
        score: percent,
        answers: allQuestions.map((q, index) => ({
          questionId: q.id || null,
          userAnswer: answers[index],
          correctAnswer: q.answer,
          isCorrect: answers[index] === q.answer,
        })),
      });

      await axios.put(
        `http://localhost:5000/api/roadmap/${roadmapItemId}/progress`,
        { progress: percent, status: percent >= 50 ? "done" : "learning" },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      await axios.post(
        "http://localhost:5000/api/roadmap/next-day",
        { currentDay: day },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      alert("✅ Nộp bài thành công!");
    } catch (err) {
      console.error("❌ Không thể lưu kết quả hoặc cập nhật tiến trình:", err);
    }
  };

  return (
    <div className="practice-lesson">
      <h2>{lesson.title}</h2>
      <p>Kỹ năng: {lesson.skill}</p>
      <p>
        Phần: Part {lesson.part} | Độ khó: <b>{lesson.level}</b>
      </p>

      {allQuestions.map((q, index) => (
        <div key={q.id || index} className="question-card">
          {q.block?.passage && (
            <div className="reading-passage">
              <strong>Đoạn văn:</strong> {q.block.passage}
            </div>
          )}
          <p><strong>Câu {index + 1}:</strong> {q.question}</p>

          <div className="options">
            {["A", "B", "C", "D"].map((opt) => (
              <button
                key={opt}
                className={`option-btn ${answers[index] === opt ? "selected" : ""}
                  ${submitted && q.answer === opt ? "correct" : ""}
                  ${submitted && answers[index] === opt && answers[index] !== q.answer ? "wrong" : ""}`}
                onClick={() => handleSelect(index, opt)}
              >
                {opt}. {q.options?.[opt]}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button className="submit-btn" onClick={handleSubmit}>
          📤 Nộp bài
        </button>
      ) : (
        <p className="score-msg">🎉 Bạn đã làm đúng {score}% câu hỏi!</p>
      )}

      <button
        className="back-btn"
        onClick={() => navigate("/roadmap")}
        style={{ marginTop: "20px" }}
      >
        🔙 Quay lại lộ trình
      </button>
    </div>
  );
};

export default PracticeReadingPage;
