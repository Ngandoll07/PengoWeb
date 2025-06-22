import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./PracticeLessonPage.css";

const PracticeLessonPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const showAnswers = useMemo(() => location.state?.showAnswers || false, [location.state]);
  const reviewAnswers = useMemo(() => location.state?.answers || [], [location.state]);

  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [grammarFeedback, setGrammarFeedback] = useState({});

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/lessons/${id}`);
        setLesson(res.data);

        const flatQuestions = [];
        res.data.questions.forEach((block) => {
          block.questions.forEach((q) => {
            flatQuestions.push({
              question: q.question,
              options: q.options,
              answer: q.answer,
              passage: block.passage || "",
            });
          });
        });

        setQuestions(flatQuestions);

        if (showAnswers && reviewAnswers.length > 0) {
          const saved = reviewAnswers.map((r) => r.selected);
          setAnswers(saved);
          setSubmitted(true);
        } else {
          setAnswers(Array(flatQuestions.length).fill(null));
        }
      } catch (err) {
        console.error("❌ Lỗi khi lấy bài học:", err);
      }
    };

    fetchLesson();
  }, [id, showAnswers, reviewAnswers]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleSelect = (index, letter) => {
    if (submitted) return;
    const updated = [...answers];
    updated[index] = letter;
    setAnswers(updated);
  };

 const handleSubmit = async () => {
  setSubmitted(true);

  const simplifiedQuestions = questions.map((q) => ({
    question: q.question,
    options: q.options,
    passage: q.passage,
  }));

  try {
    const res = await axios.post("http://localhost:5000/api/reading/score-reading-part", {
  part: lesson?.part,
  questions: simplifiedQuestions,
  answers,
});


    const feedback = res.data.feedback || [];

    const feedbackMap = {};
    feedback.forEach((item) => {
      feedbackMap[item.index] = item;
    });
    setGrammarFeedback(feedbackMap);

    const correct = feedback.filter((f) => f.correct).length;

    const result = {
      lessonId: id,
      total: questions.length,
      correct,
      incorrect: questions.length - correct,
      skipped: answers.filter((a) => a === null).length,
      answered: answers.filter((a) => a !== null).length,
      score: correct * 5,
      accuracy: Math.round((correct / questions.length) * 100),
      time: formatTime(elapsedTime),
      answers: feedback,
      partsSubmitted: [lesson?.part],
    };

    navigate("/result", {
      state: {
        result,
        sourcePage: `/practicelesson/${lesson._id}`,
        stateToPassBack: {
          showAnswers: true,
          answers: result.answers,
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi chấm điểm AI:", err);
  }
};

  return (
    <div className="practice-lesson-page">
      {lesson ? (
        <>
          <h2>{lesson.title}</h2>
          <p>
            📘 Part: {lesson.part} • 🧠 Skill: {lesson.skill} • 🎯 Level: {lesson.level}
          </p>
          <p>⏱️ Thời gian: {formatTime(elapsedTime)}</p>

        {questions.map((q, i) => {
  const aiFeedback = grammarFeedback[i];
  const selected = aiFeedback?.userAnswer || answers[i];
  const isCorrect = aiFeedback?.correct ?? (selected === q.answer);
  const correctAnswer = aiFeedback?.correctAnswer || q.answer;

  return (
    <div className="question-block" key={i}>
      {q.passage && i === 0 && (
        <div className="passage">
          <strong>📄 Đoạn văn:</strong> {q.passage}
        </div>
      )}
      <h4>Câu {i + 1}</h4>
      <p>{q.question}</p>
      <div className="options1">
        {q.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selected === letter;
          const isCorrectAnswer = correctAnswer === letter;

          return (
            <label
              key={idx}
              className={`option1 
                ${isSelected ? "selected1" : ""}
                ${submitted && isCorrectAnswer ? "correct-answer" : ""}
                ${submitted && isSelected && !isCorrectAnswer ? "wrong-answer" : ""}
              `}
            >
              <input
                type="radio"
                name={`q${i}`}
                value={letter}
                checked={isSelected}
                onChange={() => handleSelect(i, letter)}
                disabled={submitted}
              />
              {letter}. {opt}
            </label>
          );
        })}
      </div>

     {submitted && (
        <div className={`feedback ${isCorrect ? "correct" : "incorrect"}`}>
          {selected == null ? (
            <>⚠️ Chưa chọn – Đáp án đúng là: {correctAnswer}</>
          ) : isCorrect ? (
            <>✅ Đúng</>
          ) : (
            <>
              ❌ Sai – Đáp án đúng là: {correctAnswer}
              {aiFeedback?.comment && (
                <div className="ai-feedback">
                  💬 <strong>Giải thích:</strong> {aiFeedback.comment}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
})}


          {!submitted && (
            <button className="submit-btn" onClick={handleSubmit}>
              NỘP BÀI
            </button>
          )}
        </>
      ) : (
        <p>Đang tải bài học...</p>
      )}
    </div>
  );
};

export default PracticeLessonPage;
