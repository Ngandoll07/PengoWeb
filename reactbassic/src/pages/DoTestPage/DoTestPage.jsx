import React from "react";
import { useLocation } from "react-router-dom";

const DoTestPage = () => {
  const location = useLocation();
  const { test, day } = location.state || {};

  if (!test) return <p>Không có dữ liệu bài học!</p>;

  return (
    <div>
      <h2>Bài học cho Day {day}: {test.title}</h2>
      <ol>
        {test.questions.map((q, index) => (
          <li key={index}>
            <p><strong>Câu hỏi:</strong> {q.question}</p>
            <ul>
              {q.options.map((opt, idx) => (
                <li key={idx}>{opt}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default DoTestPage;
