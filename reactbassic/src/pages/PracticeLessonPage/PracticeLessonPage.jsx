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
  const [questions, setQuestions] = useState([]); // giữ theo nhóm
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [grammarFeedback, setGrammarFeedback] = useState({});

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/lessons/${id}`);
        setLesson(res.data);

        const grouped = res.data.questions.map((block) => ({
          passage: block.passage || "",
          questions: block.questions.map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
          })),
        }));

        setQuestions(grouped);

        const flatLength = grouped.reduce((sum, g) => sum + g.questions.length, 0);
        if (showAnswers && reviewAnswers.length > 0) {
          const saved = reviewAnswers.map((r) => r.selected);
          setAnswers(saved);
          setSubmitted(true);
        } else {
          setAnswers(Array(flatLength).fill(null));
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

    const simplifiedQuestions = questions.flatMap((group) =>
      group.questions.map((q) => ({
        question: q.question,
        options: q.options,
        passage: group.passage,
      }))
    );

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
        total: simplifiedQuestions.length,
        correct,
        incorrect: simplifiedQuestions.length - correct,
        skipped: answers.filter((a) => a === null).length,
        answered: answers.filter((a) => a !== null).length,
        score: correct * 5,
        accuracy: Math.round((correct / simplifiedQuestions.length) * 100),
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

          {questions.map((group, groupIndex) => (
            <div key={groupIndex} className="passage-group">
              {group.passage && (
                <div className="passage">
                  <strong>📄 Đoạn văn:</strong>
                  <p>{group.passage}</p>
                </div>
              )}

              {group.questions.map((q, i) => {
                const index = questions
                  .slice(0, groupIndex)
                  .reduce((sum, g) => sum + g.questions.length, 0) + i;

                const aiFeedback = grammarFeedback[index];
                const selected = aiFeedback?.userAnswer || answers[index];
                const isCorrect = aiFeedback?.correct ?? (selected === q.answer);
                const correctAnswer = aiFeedback?.correctAnswer || q.answer;

                return (
                  <div className="question-block" key={index}>
                    <h4>Câu {index + 1}</h4>
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
                              name={`q${index}`}
                              value={letter}
                              checked={isSelected}
                              onChange={() => handleSelect(index, letter)}
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
            </div>
          ))}

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
