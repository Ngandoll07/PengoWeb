import React, { useState } from 'react';
import './PracticeListening.css';
import { useRef } from 'react';

const partList = ["Part 1", "Part 2", "Part 3", "Part 4"];

const questionNumbers = {
  1: Array.from({ length: 6 }, (_, i) => i + 1),
  2: Array.from({ length: 25 }, (_, i) => i + 1),
  3: Array.from({ length: 39 }, (_, i) => i + 1),
  4: Array.from({ length: 30 }, (_, i) => i + 1),
};

export default function PracticeListening() {
  const [activePart, setActivePart] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const questionRefs = useRef({});

  const handleClickQuestion = (num) => {
    setSelectedQuestion(num);
    const target = questionRefs.current[`part${activePart}_q${num}`];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderAudio = (part, num) => (
    <audio controls>
      <source src={`/audios/part${part}/q${num}.mp3`} type="audio/mp3" />
      Your browser does not support the audio element.
    </audio>
  );

  const renderImage = (part, num) => (
    part === 1 && (
      <img
        src={`/images/part1/q${num}.jpg`}
        alt={`Question ${num}`}
        className="question-image"
      />
    )
  );

  return (
    <div className="toeic-page">
      <h1 className="page-title">Luyện nghe TOEIC</h1>
      <div className="toeic-listening">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="score-button">Chấm điểm</button>
            <span className="timer">10:32:00</span>
            <button className="reset-button">
              <img src="/assets/Undo Arrow.png" className="undo" />Làm lại
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
              {renderAudio(activePart, num)}
              {renderImage(activePart, num)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

