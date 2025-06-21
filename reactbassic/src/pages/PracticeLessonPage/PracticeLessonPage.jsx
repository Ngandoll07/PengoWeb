import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import axios from "axios";
import "./PracticeLessonPage.css";

const PracticeLessonPage = () => {
  const { id } = useParams();
  const location = useLocation();
const showAnswers = location.state?.showAnswers || false;
const reviewAnswers = location.state?.answers || [];

  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/lessons/${id}`);
        setLesson(res.data);

        // gom toàn bộ câu hỏi thành mảng phẳng
        const flatQuestions = [];
        res.data.questions.forEach(block => {
          block.questions.forEach(q => {
            flatQuestions.push({
              passage: block.passage,
              question: q.question,
              options: q.options,
              answer: q.answer,
            });
          });
        });

        setQuestions(flatQuestions);
        setAnswers(Array(flatQuestions.length).fill(null));
      } catch (err) {
        console.error("❌ Lỗi khi lấy bài học:", err);
      }
    };

    fetchLesson();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const mins = String(Math.floor(s / 60)).padStart(2, '0');
    const secs = String(s % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSelect = (index, option) => {
    if (submitted) return;
    const updated = [...answers];
    updated[index] = option;
    setAnswers(updated);
  };

 const handleSubmit = () => {
  setSubmitted(true);

  let correct = 0;
  const detailedAnswers = [];

  questions.forEach((q, i) => {
    const correctText = q.options["ABCD".indexOf(q.answer)];
    const isCorrect = answers[i]?.trim() === correctText?.trim();
    if (isCorrect) correct++;

    detailedAnswers.push({
      question: q.question,
      passage: q.passage,
      options: q.options,
      correctAnswer: q.answer,
      selected: answers[i],
    });
  });

  const result = {
    lessonId: id,
    total: questions.length,
    correct,
    incorrect: questions.length - correct,
    skipped: answers.filter((a) => a === null).length,
    score: correct * 5,
    accuracy: Math.round((correct / questions.length) * 100),
    time: formatTime(elapsedTime),
    answers: detailedAnswers,
    partsSubmitted: [lesson?.part],
  };

  navigate("/result", { state: result });
};


  return (
    <div className="practice-lesson-page">
      {lesson ? (
        <>
          <h2>{lesson.title}</h2>
          <p>📘 Part: {lesson.part} • 🧠 Skill: {lesson.skill} • 🎯 Level: {lesson.level}</p>
          <p>⏱️ Thời gian: {formatTime(elapsedTime)}</p>
          {questions.map((q, i) => (
            <div className="question-block" key={i} id={`q${i}`}>
              {q.passage && i === 0 && <div className="passage"><strong>📄 Đoạn văn:</strong> {q.passage}</div>}
              <h4>Câu {i + 1}</h4>
              <p>{q.question}</p>
              <div className="options">
                {q.options.map((opt, idx) => (
                  <label key={idx} className={`option ${answers[i] === opt ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={opt}
                      checked={answers[i] === opt}
                      onChange={() => handleSelect(i, opt)}
                    />
                    {String.fromCharCode(65 + idx)}. {opt}
                  </label>
                ))}
              </div>
              {submitted && (
  <div className={`feedback ${answers[i] === q.answer ? 'correct' : 'incorrect'}`}>
    {answers[i] === q.answer ? "✅ Đúng" : `❌ Sai – Đáp án đúng là: ${q.answer}`}
  </div>
)}

            </div>
          ))}
          {!submitted && <button className="submit-btn" onClick={handleSubmit}>NỘP BÀI</button>}
        </>
      ) : (
        <p>Đang tải bài học...</p>
      )}
    </div>
  );
};

export default PracticeLessonPage;
