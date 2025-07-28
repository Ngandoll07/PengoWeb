import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // ✅ Thêm useNavigate
import axios from "axios";
import "./PracticeLessonPage.css";

const PracticeLessonPage = () => {
  const { state } = useLocation();
  const { lesson, day, roadmapItemId,status  } = state || {};
  const navigate = useNavigate(); // ✅ Hook điều hướng

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  if (!lesson) return <p>Không có bài học</p>;

  const handleSelect = (qIndex, choice) => {
    if (submitted) return;
    setAnswers({ ...answers, [qIndex]: choice });
  };

  const handleSubmit = async () => {
    let correct = 0;
    lesson.questions.forEach((q, index) => {
      if (answers[index] === q.answer) correct++;
    });

    const percent = Math.round((correct / lesson.questions.length) * 100);
    setScore(percent);
    setSubmitted(true);

    const userId = localStorage.getItem("userId");

    try {
      // ✅ Lưu kết quả
      await axios.post("http://localhost:5000/api/lesson-result", {
        userId,
        roadmapItemId,
        day: Number(day),
        skill: lesson.skill,
        part: lesson.part,
        score: percent,
        answers: lesson.questions.map((q, index) => ({
          questionId: q.id || null,
          userAnswer: answers[index],
          correctAnswer: q.answer,
          isCorrect: answers[index] === q.answer,
        })),
      });

      const statusAfterSubmit = percent >= 50 ? "done" : "learning";

      // ✅ Cập nhật tiến độ
      await axios.put(
        `http://localhost:5000/api/roadmap/${roadmapItemId}/progress`,
        {
          progress: percent,
          status: statusAfterSubmit,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // ✅ Chỉ tạo bài tiếp theo nếu trước đó chưa done và giờ đạt điểm đủ
      if (status !== "done" && percent >= 50) {
        await axios.post(
          "http://localhost:5000/api/roadmap/next-day",
          { currentDay: Number(day) },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

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

      {lesson.questions.map((q, index) => (
        <div key={q.id || index} className="question-card">
          <p>
            <strong>Câu {index + 1}:</strong> {q.question}
          </p>
          {q.image && <img src={q.image} alt="Visual" />}
          {q.audio && <audio controls src={q.audio}></audio>}

          <div className="options">
            {["A", "B", "C", "D"].map((opt) => (
              <button
                key={opt}
                className={`option-btn ${
                  answers[index] === opt ? "selected" : ""
                } ${submitted && q.answer === opt ? "correct" : ""} ${
                  submitted &&
                  answers[index] === opt &&
                  answers[index] !== q.answer
                    ? "wrong"
                    : ""
                }`}
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

      {/* ✅ Nút quay lại lộ trình */}
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

export default PracticeLessonPage;
