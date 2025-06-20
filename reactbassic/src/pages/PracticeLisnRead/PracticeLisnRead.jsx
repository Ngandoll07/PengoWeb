import React, { useState, useRef } from "react";
import "./PracticeLisnRead.css";

const partList = ["Part 1", "Part 2", "Part 3", "Part 4", "Part 5", "Part 6", "Part 7"];

const questionNumbers = {
    1: Array.from({ length: 6 }, (_, i) => i + 1),
    2: Array.from({ length: 25 }, (_, i) => i + 1),
    3: Array.from({ length: 39 }, (_, i) => i + 1),
    4: Array.from({ length: 30 }, (_, i) => i + 1),
    5: Array.from({ length: 30 }, (_, i) => i + 1),
    6: Array.from({ length: 16 }, (_, i) => i + 1),
    7: Array.from({ length: 54 }, (_, i) => i + 1),
};

export default function PracticeLisnRead() {
    const [activePart, setActivePart] = useState(1);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    const questionRefs = useRef({});

    const handleClickQuestion = (num) => {
        setSelectedQuestion(num);
        const target = questionRefs.current[`part${activePart}_q${num}`];
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const renderOptions = (questionId) => {
        const options = ["A", "B", "C", "D"];
        return (
            <div className="option-list">
                {options.map((option) => (
                    <div
                        key={option}
                        className={`option-item ${selectedAnswers[questionId] === option ? "selected" : ""}`}
                        onClick={() =>
                            setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }))
                        }
                    >
                        {option}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="practice-lisn-read">
            <h1 className="page-title">Luyện tập TOEIC Listening & Reading</h1>
            <div className="toeic-page1">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <button className="score-button">Chấm điểm</button>
                        <span className="timer">10:32:00</span>
                        <button className="reset-button"><img src="/assets/Undo Arrow.png" className="undo" />Làm lại</button>
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
                        {questionNumbers[activePart].map((num) => (
                            <div
                                key={num}
                                className={`question-circle ${selectedQuestion === num ? "selected" : ""}`}
                                onClick={() => handleClickQuestion(num)}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="content-area">
                    <h2>Nội dung {partList[activePart - 1]}</h2>
                    {questionNumbers[activePart].map((num) => (
                        <div
                            key={num}
                            ref={(el) => (questionRefs.current[`part${activePart}_q${num}`] = el)}
                            className="question-block"
                        >
                            <h4>Câu {num}</h4>
                            <p>[Nội dung câu hỏi {num} từ backend]</p>
                            {renderOptions(`part${activePart}_q${num}`)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
