// src/pages/PracticeLisnRead/PracticeLisnRead.jsx
import React, { useState, useEffect, useRef } from "react";
import "./PracticeLisnRead.css";
import { useNavigate,useLocation  } from "react-router-dom";

const partList = [
  "Part 1", "Part 2", "Part 3", "Part 4",
  "Part 5", "Part 6", "Part 7"
];

export default function PracticeLisnRead() {
  const navigate = useNavigate();

  // ===== State & refs =====
  const [submitted, setSubmitted] = useState(false);
  const [activePart, setActivePart] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { qId: 'A', ... }
  const [listeningQuestions, setListeningQuestions] = useState([]); // array from /data
  const [readingQuestions, setReadingQuestions] = useState([]); // array from /data
  const [timeLeft, setTimeLeft] = useState(60 * 60); // seconds
  const [studyPlan, setStudyPlan] = useState(null);

  const [showGoalPopup, setShowGoalPopup] = useState(false);
  const [targetScore, setTargetScore] = useState("");
  const [studyDuration, setStudyDuration] = useState("");

  // --- NEW: result popup + feedback state ---
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultSummary, setResultSummary] = useState(null); // finalResult object
  const [feedbackMap, setFeedbackMap] = useState({}); // { qId: feedbackObj }
  const [feedbackByPartState, setFeedbackByPartState] = useState({ listening: [], 5: [], 6: [], 7: [] });

  const questionRefs = useRef({});
  const timerRef = useRef(null);

  const TOTAL_TIME = 60 * 60; // 1 hour

  // ===== Fetch test data =====
  useEffect(() => {
    fetch("/data/test1_listening.json")
      .then((res) => res.json())
      .then((data) => setListeningQuestions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi tải listening:", err));

    fetch("/data/test1_reading.json")
      .then((res) => res.json())
      .then((data) => setReadingQuestions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi tải reading:", err));
  }, []);

  // ===== Timer =====
  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setShowGoalPopup(true); // time up -> show popup
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ===== Helpers =====
  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const elapsedTime = TOTAL_TIME - timeLeft;

  // get questions for current activePart (used to render)
  const getQuestionsByPart = () => {
    const all = activePart <= 4 ? listeningQuestions : readingQuestions;
    const seen = new Set();
    return (all || []).filter((q) => {
      const partValue = typeof q.part === "string" ? parseInt(q.part) : q.part;
      if (partValue !== activePart) return false;
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  };
  const questionsByPartForRender = getQuestionsByPart();

  // Build listeningAnswers object (only listening q ids)
  const listeningAnswers = Object.fromEntries(
    Object.entries(selectedAnswers).filter(([qId]) =>
      listeningQuestions.some((q) =>
        q.id === qId || (Array.isArray(q.questions) && q.questions.some((sq) => sq.id === qId))
      )
    )
  );

  // Build answersByPart as arrays aligned to blocks for sending to reading API
  // We'll create an object {5: {questions: [...], answers: [...]}, 6: [...], 7: [...]}
  const buildReadingPayloads = () => {
    const payload = { 5: [], 6: [], 7: [] };

    // Part 5: readingQuestions likely an array of single-question items with options object
    const part5Items = readingQuestions.filter((r) => parseInt(r.part) === 5);
    if (part5Items.length > 0) {
      const qObjs = part5Items.map((it) => ({
        id: it.id,
        question: it.question,
        options: [it.options?.A, it.options?.B, it.options?.C, it.options?.D],
        answer: it.answer // correct letter
      }));
      const answers = part5Items.map((it) => selectedAnswers[it.id] ?? "Không chọn");
      payload[5].push({ questions: qObjs, answers });
    }

    // Part 6 & 7: blocks containing passage/paragraph and sub-questions array
    [6, 7].forEach((part) => {
      const blocks = readingQuestions.filter((r) => parseInt(r.part) === part);
      blocks.forEach((block) => {
        // block.questions expected array of subQ { id, question, options: {A,B,C,D}, answer }
        const qObjs = (block.questions || []).map((sq) => ({
          id: sq.id,
          question: `${block.paragraph || block.passage || ""}\n${sq.question}`.trim(),
          options: [sq.options?.A, sq.options?.B, sq.options?.C, sq.options?.D],
          answer: sq.answer
        }));
        const answers = (block.questions || []).map((sq) => selectedAnswers[sq.id] ?? "Không chọn");
        payload[part].push({ questions: qObjs, answers });
      });
    });

    return payload;
  };

  // ===== UI helpers =====
  const handleClickQuestion = (questionId) => {
    setSelectedQuestion(questionId);
    const target = questionRefs.current[questionId];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const renderOptions = (questionId, optionsObj) => {
    // optionsObj could be {A: 'text', B: 'text'...} or array
    if (!optionsObj) return null;
    const entries = Array.isArray(optionsObj)
      ? optionsObj.map((v, i) => [String.fromCharCode(65 + i), v])
      : Object.entries(optionsObj);
    return (
      <div className="option-list">
        {entries.map(([key, text]) => (
          <div
            key={key}
            className={`option-item ${selectedAnswers[questionId] === key ? "selected" : ""}`}
            onClick={() => setSelectedAnswers((prev) => ({ ...prev, [questionId]: key }))}
          >
            <strong>{key}. </strong>{text}
          </div>
        ))}
      </div>
    );
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSelectedQuestion(null);
    setStudyPlan(null);
    setTimeLeft(TOTAL_TIME);
    startTimer();
    setSubmitted(false);
    setResultSummary(null);
    setShowResultPopup(false);
    setFeedbackMap({});
    setFeedbackByPartState({ listening: [], 5: [], 6: [], 7: [] });
  };

  // ====== SUBMISSION FLOW ======
  const handleSubmitScore = async () => {
    setSubmitted(true);
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId") || null;

    if (!token) {
      alert("Vui lòng đăng nhập để nộp bài");
      setSubmitted(false);
      return;
    }

    try {
      let totalCorrect = 0;
      let totalSkipped = 0;
      let totalQuestions = 0;
      const feedbackTemp = [];
      const resultByPart = {};

      // --- 1) Evaluate Listening (if any)
      if ((listeningQuestions || []).length > 0) {
        const listeningResp = await fetch("http://localhost:5000/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionIds: [].concat(
              ...listeningQuestions.map((q) =>
                q.questions ? q.questions.map((sq) => sq.id) : [q.id]
              )
            ),
            selectedAnswers
          })
        });

        if (!listeningResp.ok) {
          console.warn("Evaluate API (listening) lỗi:", await listeningResp.text());
        } else {
          const listeningResult = await listeningResp.json();
          // listeningResult expected: { total, correct, results:[{id, isCorrect, explanation, ...}], transcript, skipped }
          resultByPart.listening = listeningResult;
          totalCorrect += listeningResult.correct || 0;
          totalSkipped += listeningResult.skipped || 0;
          totalQuestions += listeningResult.total || (listeningResult.results?.length || 0);
          if (Array.isArray(listeningResult.results)) {
            listeningResult.results.forEach((r) => {
              feedbackTemp.push({
                id: r.id,
                part: "listening",
                isCorrect: !!r.isCorrect,
                userAnswer: selectedAnswers[r.id] ?? null,
                correctAnswer: r.correctAnswer ?? null,
                explanation: r.explanation ?? r.explain ?? null,
                transcript: r.transcript ?? listeningResult.transcript ?? null
              });
            });
          }
        }
      }

      // --- 2) Evaluate Reading (Part 5 as batch, Part 6/7 per block)
      const readingPayloads = buildReadingPayloads();

      // Part 5 (if any)
      if (readingPayloads[5].length > 0) {
        // readingPayloads[5] is array with one element {questions: [...], answers: [...]}
        const p5 = readingPayloads[5][0];
        // Prepare questions array in the shape backend expects (question/options/answer)
        const questionsForApi = p5.questions.map((q) => ({
          question: q.question,
          options: q.options,
          answer: q.answer
        }));
        const answersForApi = p5.answers.map((a) => a ?? "Không chọn");

        const r5 = await fetch("http://localhost:5000/api/reading/score-reading-part", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part: 5,
            questions: questionsForApi,
            answers: answersForApi
          })
        });

        if (!r5.ok) {
          console.warn("Reading part5 API lỗi:", await r5.text());
        } else {
          const data = await r5.json();
          resultByPart.part5 = data;
          totalCorrect += data.correct || 0;
          totalSkipped += data.skipped || 0;
          totalQuestions += data.total || questionsForApi.length;
          if (Array.isArray(data.feedback)) {
            // map feedback to include id and part
            data.feedback.forEach((fb, idx) => {
              const qid = p5.questions[idx]?.id || null;
              feedbackTemp.push({
                id: qid,
                part: 5,
                userAnswer: selectedAnswers[qid] ?? null,
                correctAnswer: fb.correctAnswer ?? null,
                correct: fb.correct ?? null,
                label: fb.label ?? null,
                comment: fb.comment ?? null
              });
            });
          }
        }
        // small delay to be nice to AI server
        await new Promise((r) => setTimeout(r, 400));
      }

      // Part 6 & 7 blocks
      for (const part of [6, 7]) {
        const blocks = readingPayloads[part]; // array of {questions, answers}
        resultByPart[`part${part}`] = { correct: 0, skipped: 0, total: 0, feedback: [] };

        for (const block of blocks) {
          const questionsForApi = block.questions.map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.answer
          }));
          const answersForApi = block.answers.map((a) => a ?? "Không chọn");

          const r = await fetch("http://localhost:5000/api/reading/score-reading-part", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              part,
              questions: questionsForApi,
              answers: answersForApi
            })
          });

          if (!r.ok) {
            console.warn(`Reading part ${part} API lỗi:`, await r.text());
          } else {
            const data = await r.json();
            resultByPart[`part${part}`].correct += data.correct || 0;
            resultByPart[`part${part}`].skipped += data.skipped || 0;
            resultByPart[`part${part}`].total += data.total || questionsForApi.length;
            totalCorrect += data.correct || 0;
            totalSkipped += data.skipped || 0;
            totalQuestions += data.total || questionsForApi.length;

            if (Array.isArray(data.feedback)) {
              data.feedback.forEach((fb, idx) => {
                const qid = block.questions[idx]?.id || null;
                feedbackTemp.push({
                  id: qid,
                  part,
                  userAnswer: selectedAnswers[qid] ?? null,
                  correctAnswer: fb.correctAnswer ?? null,
                  correct: fb.correct ?? null,
                  label: fb.label ?? null,
                  comment: fb.comment ?? null
                });
              });
            }
          }

          // throttle to reduce 429 risk
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      // --- 3) Save test result to backend ---
      const savePayload = {
        userId,
        correct: totalCorrect,
        incorrect: Math.max(0, totalQuestions - totalCorrect - totalSkipped),
        skipped: totalSkipped,
        answered: Math.max(0, totalQuestions - totalSkipped),
        total: totalQuestions,
        score: totalCorrect * 5,
        listeningCorrect: resultByPart.listening?.correct ?? 0,
        readingCorrect: totalCorrect - (resultByPart.listening?.correct ?? 0),
        partsSubmitted: [
          ...(listeningQuestions.length ? [1,2,3,4] : []),
          ...(readingQuestions.some(r=>r.part===5) ? [5] : []),
          ...(readingQuestions.some(r=>r.part===6) ? [6] : []),
          ...(readingQuestions.some(r=>r.part===7) ? [7] : [])
        ],
        time: formatTime(elapsedTime),
        answers: selectedAnswers,
        aiFeedback: feedbackTemp
      };

      const saveRes = await fetch("http://localhost:5000/api/test-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(savePayload)
      });

      if (!saveRes.ok) {
        console.warn("Lưu test-result lỗi:", await saveRes.text());
      }

      const saveData = await saveRes.json();
      // backend might return id in different fields; handle a few variants
      const testResultId =
        saveData?.testResultId ||
        saveData?.result?._id ||
        saveData?.result?.id ||
        saveData?._id ||
        saveData?.id ||
        null;

      // --- 4) Call recommend once with testResultId (if available) ---
      let recommendData = {};
      if (testResultId) {
        try {
          const recResp = await fetch(
            `http://localhost:5000/api/recommend?testResultId=${encodeURIComponent(testResultId)}&targetScore=${encodeURIComponent(targetScore || "")}&studyDuration=${encodeURIComponent(studyDuration || "")}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              }
            }
          );
          if (recResp.status === 401) {
            alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
          } else if (recResp.ok) {
            recommendData = await recResp.json();
            // optionally update studyPlan in DB if backend returns suggestion
            if (recommendData?.suggestion) {
              setStudyPlan(recommendData.suggestion);
              // try to persist studyPlan to test-results (not mandatory)
              try {
                await fetch(`http://localhost:5000/api/test-results/${encodeURIComponent(testResultId)}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ studyPlan: recommendData.suggestion })
                });
              } catch (e) {
                console.warn("Không thể cập nhật studyPlan cho test-result:", e.message);
              }
            }
          } else {
            console.warn("Recommend API lỗi:", await recResp.text());
          }
        } catch (e) {
          console.warn("Lỗi gọi recommend:", e);
        }
      }

      // --- 5) Group feedback by part for UI ---
      const feedbackByPart = { listening: [], 5: [], 6: [], 7: [] };
      feedbackTemp.forEach((fb) => {
        if (fb.part === "listening") feedbackByPart.listening.push(fb);
        if ([5, 6, 7].includes(fb.part)) feedbackByPart[fb.part].push(fb);
      });

      // --- 6) Instead of navigating, show popup and save feedback into state ---
      const finalResult = {
        correct: totalCorrect,
        incorrect: Math.max(0, totalQuestions - totalCorrect - totalSkipped),
        skipped: totalSkipped,
        answered: Math.max(0, totalQuestions - totalSkipped),
        total: totalQuestions,
        score: totalCorrect * 5,
        accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        time: formatTime(elapsedTime),
        aiFeedback: feedbackTemp,
        studyPlan: recommendData?.suggestion ?? null
      };

      // set states for popup + feedback rendering
      setResultSummary(finalResult);
      setFeedbackByPartState(feedbackByPart);
      setFeedbackMap(Object.fromEntries(feedbackTemp.map(f => [f.id, f])));
      setShowResultPopup(true);

      // re-enable buttons
      setSubmitted(false);

      // --- removed navigate to /result ---

    } catch (err) {
      console.error("❌ Lỗi khi nộp bài:", err);
      alert("Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại.");
      setSubmitted(false);
    }
  };

  // small helper for popup confirm
  const submitWithGoal = () => {
    setShowGoalPopup(false);
    handleSubmitScore();
  };

  // ===== Render =====
  return (
    <div className="practice-lisn-read">
      <h1 className="page-title">Luyện tập TOEIC Listening & Reading</h1>
      <div className="toeic-page1">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="score-button" onClick={() => setShowGoalPopup(true)}>Chấm điểm</button>
            <span className="timer">{formatTime(timeLeft)}</span>
            <button className="reset-button" onClick={handleReset}>
              <img src="/assets/Undo Arrow.png" className="undo" alt="reset" /> Làm lại
            </button>
          </div>

          <div className="part-tabs-bar">
            {partList.map((part, idx) => (
              <button
                key={part}
                className={`part-tab ${activePart === idx + 1 ? "active" : ""}`}
                onClick={() => { setActivePart(idx + 1); setSelectedQuestion(null); }}
              >
                {part}
              </button>
            ))}
          </div>

          <div className="question-grid">
            {questionsByPartForRender.flatMap((q) =>
              q.questions
                ? q.questions.map((subQ) => (
                  <button
                    key={subQ.id}
                    className={`question-number ${selectedQuestion === subQ.id ? "selected" : ""} ${selectedAnswers[subQ.id] ? "answered" : ""}`}
                    onClick={() => handleClickQuestion(subQ.id)}
                  >
                    {subQ.id.replace("q", "")}
                  </button>
                ))
                : (
                  <button
                    key={q.id}
                    className={`question-number ${selectedQuestion === q.id ? "selected" : ""} ${selectedAnswers[q.id] ? "answered" : ""}`}
                    onClick={() => handleClickQuestion(q.id)}
                  >
                    {q.id.replace("q", "")}
                  </button>
                )
            )}
          </div>
        </div>

        <div className="question-area">
          <h2>Nội dung {partList[activePart - 1]}</h2>

          {questionsByPartForRender.map((q, i) => (
            <div className="question-block" key={q.id} id={q.id}>
              <h4>{q.id.startsWith("q") ? `Câu ${q.id.replace("q", "")}` : `Đoạn ${q.id}`}</h4>

              {q.audio && <audio controls><source src={q.audio} type="audio/mp3" /></audio>}
              {q.image && <img src={q.image} alt={`Câu ${i + 1}`} className="question-image" />}

              {q.question && (
                <>
                  <p>{q.question}</p>
                  {q.options && renderOptions(q.id, q.options)}

                  {/* --- show feedback for single-question items (when available) --- */}
                  {feedbackMap[q.id] && (
                    <div className="ai-feedback">
                      <p><strong>Đáp án đúng:</strong> {feedbackMap[q.id].correctAnswer ?? feedbackMap[q.id].answer ?? ""}</p>
                      <p><strong>Kết quả:</strong> {(feedbackMap[q.id].correct ?? feedbackMap[q.id].isCorrect) ? "✅ Đúng" : "❌ Sai"}</p>
                      {(feedbackMap[q.id].comment || feedbackMap[q.id].explanation) && (
                        <p><strong>Giải thích:</strong> {feedbackMap[q.id].comment ?? feedbackMap[q.id].explanation}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {q.paragraph && (
                <>
                  <p className="passage">{q.paragraph}</p>
                  {Array.isArray(q.questions) && q.questions.map((subQ) => (
                    <div key={subQ.id} ref={(el) => (questionRefs.current[subQ.id] = el)} className="sub-question">
                      <p><strong>{`Câu ${subQ.id.replace("q", "")}`}</strong>: {subQ.question}</p>
                      {renderOptions(subQ.id, subQ.options)}

                      {/* --- show feedback for sub-questions --- */}
                      {feedbackMap[subQ.id] && (
                        <div className="ai-feedback">
                          <p><strong>Đáp án đúng:</strong> {feedbackMap[subQ.id].correctAnswer ?? feedbackMap[subQ.id].answer ?? ""}</p>
                          <p><strong>Kết quả:</strong> {(feedbackMap[subQ.id].correct ?? feedbackMap[subQ.id].isCorrect) ? "✅ Đúng" : "❌ Sai"}</p>
                          {(feedbackMap[subQ.id].comment || feedbackMap[subQ.id].explanation) && (
                            <p><strong>Giải thích:</strong> {feedbackMap[subQ.id].comment ?? feedbackMap[subQ.id].explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}

          {/* Submit button */}
          { (Object.keys(selectedAnswers).length > 0) && (
            <div style={{ marginTop: 16 }}>
              <button className="submit-btn" onClick={() => setShowGoalPopup(true)} disabled={submitted}>
                NỘP BÀI
              </button>
            </div>
          )}
{/* --- Result Summary --- */}
{resultSummary && (
  <div
    className="result-summary"
    style={{
      marginTop: 24,
      padding: "16px 20px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, #f8fbff, #eef5ff)",
      border: "1px solid #d0e2ff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      fontSize: "16px",
      lineHeight: "1.6",
      maxWidth: 400,
    }}
  >
    <strong
      style={{
        fontSize: "19px",
        display: "block",
        marginBottom: 10,
        color: "#2d3e50",
      }}
    >
      📊 Kết quả của bạn
    </strong>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px dashed #cdd8f0",
      }}
    >
      <span>✅ Đúng</span>
      <span style={{ color: "#28a745", fontWeight: 700 }}>
        {resultSummary.correct}
      </span>
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px dashed #cdd8f0",
      }}
    >
      <span>❌ Sai</span>
      <span style={{ color: "#dc3545", fontWeight: 700 }}>
        {resultSummary.incorrect}
      </span>
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
      }}
    >
      <span>⏭ Bỏ qua</span>
      <span style={{ color: "#ffc107", fontWeight: 700 }}>
        {resultSummary.skipped}
      </span>
    </div>
  </div>
)}

        </div>
      </div>

      {/* Result popup (re-uses goal popup styles to keep CSS unchanged) */}
      {showResultPopup && resultSummary && (
        <div className="goal-popup-overlay">
          <div className="goal-popup-box">
            <h3>Kết quả bài làm</h3>
            <p>✅ Đúng: {resultSummary.correct}</p>
            <p>❌ Sai: {resultSummary.incorrect}</p>
            <p>⏳ Bỏ qua: {resultSummary.skipped}</p>
            <p>🎯 Điểm: {resultSummary.score}</p>
            <p>📊 Độ chính xác: {resultSummary.accuracy}%</p>
            <p>🕒 Thời gian: {resultSummary.time}</p>

            <div style={{ marginTop: 12 }}>
              <button onClick={() => setShowResultPopup(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showGoalPopup && (
        <div className="goal-popup-overlay">
          <div className="goal-popup-box">
            <h3>🎯 Mục tiêu & Thời gian học</h3>

            <label>
              Mục tiêu điểm số:
              <select value={targetScore} onChange={(e) => setTargetScore(e.targetValue)}>
                <option value="">--Chọn--</option>
                <option value="450">450+</option>
                <option value="550">550+</option>
                <option value="650">650+</option>
                <option value="750">750+</option>
              </select>
            </label>

            <label>
              Thời gian học:
              <select value={studyDuration} onChange={(e) => setStudyDuration(e.targetValue)}>
                <option value="">--Chọn--</option>
                <option value="2 tuần">2 tuần</option>
                <option value="1 tháng">1 tháng</option>
                <option value="2 tháng">2 tháng</option>
              </select>
            </label>

            <div style={{ marginTop: 12 }}>
              <button onClick={submitWithGoal}>Xác nhận & Chấm điểm</button>
              <button onClick={() => setShowGoalPopup(false)} style={{ marginLeft: 8 }}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
