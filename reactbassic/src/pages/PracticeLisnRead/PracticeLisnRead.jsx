import React, { useState, useEffect, useRef } from "react";
import "./PracticeLisnRead.css";

const partList = [
    "Part 1", "Part 2", "Part 3", "Part 4", // Listening
    "Part 5", "Part 6", "Part 7"              // Reading
];

export default function PracticeLisnRead() {
    const [activePart, setActivePart] = useState(1);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [questions, setQuestions] = useState([]);
    const questionRefs = useRef({});

    useEffect(() => {
        const file = activePart <= 4 ? "test1_listening.json" : "test1_reading.json";
        fetch(`/data/${file}`)
            .then((res) => res.json())
            .then((data) => setQuestions(data))
            .catch((err) => console.error("Lỗi tải dữ liệu:", err));
    }, [activePart]);

    const handleClickQuestion = (questionId) => {
        setSelectedQuestion(questionId);
        const target = questionRefs.current[questionId];
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const renderOptions = (questionId, options) => (
        <div className="option-list">
            {Object.entries(options).map(([key, value]) => (
                <div
                    key={key}
                    className={`option-item ${selectedAnswers[questionId] === key ? "selected" : ""}`}
                    onClick={() => setSelectedAnswers((prev) => ({ ...prev, [questionId]: key }))}
                >
                    <strong>{key}. </strong>{value}
                </div>
            ))}
        </div>
    );

    const questionsByPart = questions.filter((q) => q.part === activePart);

    return (
        <div className="practice-lisn-read">
            <h1 className="page-title">Luyện tập TOEIC Listening & Reading</h1>
            <div className="toeic-page1">
                {/* ==== SIDEBAR ==== */}
                <div className="sidebar">
                    <div className="sidebar-header">
                        <button className="score-button">Chấm điểm</button>
                        <span className="timer">10:32:00</span>
                        <button className="reset-button">
                            <img src="/assets/Undo Arrow.png" className="undo" alt="reset" />Làm lại
                        </button>
                    </div>

                    <div className="part-tabs">
                        {partList.map((part, idx) => (
                            <button
                                key={idx}
                                className={`part-tab ${activePart === idx + 1 ? "active" : ""}`}
                                onClick={() => {
                                    setActivePart(idx + 1);
                                    setSelectedQuestion(null);
                                }}
                            >
                                {part}
                            </button>
                        ))}
                    </div>

                    <div className="question-grid">
                        {questionsByPart.map((q, idx) => (
                            <div
                                key={q.id}
                                className={`question-circle ${selectedQuestion === q.id ? "selected" : ""}`}
                                onClick={() => handleClickQuestion(q.id)}
                            >
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ==== CONTENT AREA ==== */}
                <div className="content-area">
                    <h2>Nội dung {partList[activePart - 1]}</h2>
                    {questionsByPart.map((q, idx) => (
                        <div
                            key={q.id}
                            ref={(el) => (questionRefs.current[q.id] = el)}
                            className="question-block"
                        >
                            <h4>Câu {idx + 1}</h4>

                            {/* Audio nếu có */}
                            {q.audio && (
                                <audio controls>
                                    <source src={q.audio} type="audio/mp3" />
                                </audio>
                            )}

                            {/* Hình ảnh nếu có */}
                            {q.image && (
                                <img src={q.image} alt={`Câu ${idx + 1}`} className="question-image" />
                            )}

                            {/* Nếu là câu hỏi đơn như Part 1–4 */}
                            {q.question && (
                                <>
                                    <p>{q.question}</p>
                                    {q.options && renderOptions(q.id, q.options)}
                                </>
                            )}

                            {/* Nếu là đoạn chứa nhiều câu hỏi như Part 6–7 */}
                            {q.paragraph && (
                                <>
                                    <p>{q.paragraph}</p>
                                    {q.questions.map((subQ, subIdx) => (
                                        <div key={subQ.id} className="sub-question">
                                            <p>
                                                <strong>{`Câu ${subQ.id.replace("q", "")}`}</strong>: {subQ.question}
                                            </p>
                                            {renderOptions(subQ.id, subQ.options)}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
