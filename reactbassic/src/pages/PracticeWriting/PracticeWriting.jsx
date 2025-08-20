import React, { useState, useEffect } from 'react';
import './PracticeWriting.css';

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const formatTime = (s) => {
  const mins = String(Math.floor(s / 60)).padStart(2, '0');
  const secs = String(s % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};
const parseEmailMeta = (text) => {
  const lines = text.split('\n').map((line) => line.trim());
  const getLine = (prefix) =>
    lines.find((line) => line.startsWith(prefix))?.replace(prefix, '').trim() || '';
  return {
    from: getLine('FROM '),
    to: getLine('TO '),
    subject: getLine('SUBJECT '),
    sent: getLine('SENT ')
  };
};

const PracticeWriting = () => {
  const [writingTopics, setWritingTopics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePart, setActivePart] = useState(1);
  const [responses, setResponses] = useState(Array(5).fill(''));
  const [submitted, setSubmitted] = useState(Array(5).fill(false));
  const [feedback, setFeedback] = useState(Array(5).fill(''));
  const [part2Responses, setPart2Responses] = useState(['', '']);
  const [part2Feedback, setPart2Feedback] = useState(['', '']);
  const [part2Submitted, setPart2Submitted] = useState([false, false]);
  const [essayResponse, setEssayResponse] = useState('');
  const [essayFeedback, setEssayFeedback] = useState('');
  const [essaySubmitted, setEssaySubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);

  const currentTask = writingTopics[currentIndex];

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/writing-topics');
        const data = await res.json();
        setWritingTopics(data);
      } catch (err) {
        console.error('Lỗi khi tải writing topics:', err);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReset = () => {
    setResponses(Array(5).fill(''));
    setSubmitted(Array(5).fill(false));
    setFeedback(Array(5).fill(''));
    setPart2Responses(['', '']);
    setPart2Feedback(['', '']);
    setPart2Submitted([false, false]);
    setEssayResponse('');
    setEssayFeedback('');
    setEssaySubmitted(false);
    setTime(0);
  };

  const handleSubmit = async () => {
    if (!currentTask) return;
    setLoading(true);
    try {
      const part1Payload = currentTask.part1.map((q, idx) => ({
        imageUrl: q.image,
        keywords: q.keywords,
        userSentence: responses[idx]
      }));

      const part2Payload = currentTask.part2.questions.map((q, idx) => ({
        email: q.email,
        prompt: q.prompt,
        text: part2Responses[idx]
      }));

      const part3Payload = {
        question: currentTask.part3.question.prompt,
        text: essayResponse
      };

      const res = await fetch('http://localhost:5000/api/writing/fullscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part1: part1Payload, part2: part2Payload, part3: part3Payload })
      });

      const data = await res.json();
      setFeedback(data.part1Feedback || []);
      setSubmitted(Array(part1Payload.length).fill(true));
      setPart2Feedback(data.part2Feedback || []);
      setPart2Submitted(Array(part2Payload.length).fill(true));
      setEssayFeedback(data.part3Feedback || '');
      setEssaySubmitted(true);
    } catch (err) {
      console.error('❌ Lỗi khi gửi bài:', err);
      alert('Đã có lỗi khi gửi bài. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentTask) return <div className="writing-page">⏳ Đang tải đề bài...</div>;

  return (
    <div className="writing-page">
      <div className="sidebar">
        <div class="sidebar-header">
          <button className="score-button" onClick={handleSubmit} disabled={loading}>Chấm điểm</button>
          <span className="timer">{formatTime(time)}</span>
          <button className="reset-button" onClick={handleReset}>
            <img src="/assets/Undo Arrow.png" alt="undo" className="icon-undo" />
            Làm lại
          </button>
        </div>
       <div className="dropdown-topic">
  <label className="dropdown-label">📚 Chọn đề:</label>
  <div className="select-wrapper">
    <select
      value={currentIndex}
      onChange={(e) => {
        setCurrentIndex(Number(e.target.value));
        handleReset();
      }}
    >
      {writingTopics.map((topic, idx) => (
        <option key={topic._id} value={idx}>
          Đề {idx + 1}
        </option>
      ))}
    </select>
  </div>
</div>

        <div className="tab-container">
          {[1, 2, 3].map((part) => (
            <button
              key={part}
              className={`tab-button ${activePart === part ? 'active' : ''}`}
              onClick={() => setActivePart(part)}
            >
              Part {part}
            </button>
          ))}
        </div>
      </div>

      <div className="writing-content">
        {activePart === 1 && (
          <>
            <h2 className="writing-title">Part 1: Write a sentence based on a picture</h2>
            <p className="writing-instruction"><strong>Directions:</strong> Write ONE sentence based on the picture...</p>
            {currentTask.part1.map((q, idx) => {
              const wordCount = countWords(responses[idx]);
              const invalid = wordCount < q.minWords || wordCount > q.maxWords;
              return (
                <div key={idx} className="writing-question">
                  <h3>Question {idx + 1}</h3>
                  <img src={q.image} alt={`Question ${idx + 1}`} className="question-image" />
                  <p><strong>Use these words:</strong> {q.keywords.join(', ')}</p>
                  <textarea
                    value={responses[idx]}
                    onChange={(e) => {
                      const newRes = [...responses];
                      newRes[idx] = e.target.value;
                      setResponses(newRes);
                    }}
                    rows={3}
                    placeholder="Write your sentence here..."
                  />
                  {submitted[idx] && (
                    <div className="feedback-box"><strong>Phản hồi:</strong><p>{feedback[idx]}</p></div>
                  )}
                  <div className={`word-count ${invalid ? 'invalid' : ''}`}>
                    Word Count: {wordCount} {wordCount < q.minWords && '(Too short)'} {wordCount > q.maxWords && '(Too long)'}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activePart === 2 && (
          <>
            <h2 className="writing-title">Part 2: Respond to a Written Request</h2>
            <p className="writing-instruction">{currentTask.part2.instruction}</p>
            {currentTask.part2.questions.map((q, idx) => {
              const meta = parseEmailMeta(q.email);
              return (
                <div key={q.id} className="writing-question">
                  <h3>Question {q.id}</h3>
                  <div className="email-meta">
                    <p><strong>From:</strong> {meta.from}</p>
                    <p><strong>To:</strong> {meta.to}</p>
                    <p><strong>Subject:</strong> {meta.subject}</p>
                    <p><strong>Sent:</strong> {meta.sent}</p>
                  </div>
                  <p>{q.prompt}</p>
                  <textarea
                    value={part2Responses[idx]}
                    onChange={(e) => {
                      const newRes = [...part2Responses];
                      newRes[idx] = e.target.value;
                      setPart2Responses(newRes);
                    }}
                    style={{ width: '100%', height: '200px', fontSize: '16px', padding: '10px' }}
                    placeholder={`Write your response here... (${q.minWords}-${q.maxWords} words)`}
                  />
                  <div className="writing-meta">
                    <span>Số từ: {countWords(part2Responses[idx])}</span>
                    <span>Yêu cầu: {q.minWords} - {q.maxWords} từ</span>
                  </div>
                  {part2Submitted[idx] && (
                    <div className="feedback-box"><strong>Phản hồi:</strong><p>{part2Feedback[idx]}</p></div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {activePart === 3 && (
          <>
            <h2 className="writing-title">Part 3: Opinion Essay</h2>
            <p className="writing-instruction">{currentTask.part3.instruction}</p>
            <pre className="writing-prompt">{currentTask.part3.question.prompt}</pre>
            <textarea
              className="writing-textarea round-textarea"
              value={essayResponse}
              onChange={(e) => setEssayResponse(e.target.value)}
              placeholder="Nhập câu trả lời của bạn bằng tiếng Anh..."
              rows={10}
            />
            <div className="writing-meta">
              <span>Số từ: {countWords(essayResponse)}</span>
              <span>Yêu cầu: {currentTask.part3.question.minWords} - {currentTask.part3.question.maxWords} từ</span>
            </div>
            {essaySubmitted && (
              <div className="feedback-box"><strong>Phản hồi:</strong><p>{essayFeedback}</p></div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PracticeWriting;
