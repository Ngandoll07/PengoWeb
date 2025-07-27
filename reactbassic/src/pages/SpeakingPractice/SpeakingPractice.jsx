import React, { useState, useRef } from "react";
import "./SpeakingPractice.css";
import { speakText } from "../../utils/tts";

export default function SpeakingPractice() {
    const [part, setPart] = useState(1);
    const [question, setQuestion] = useState(null);
    const [recording, setRecording] = useState(false);
    const [result, setResult] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleChangePart = async (p) => {
        setPart(p);
        setResult(null);
        setRecording(false);
        setQuestion(null);

        try {
            const res = await fetch(`http://localhost:5000/api/speaking/random/${p}`);
            const data = await res.json();
            setQuestion(data);
        } catch (err) {
            alert("❌ Lỗi tải câu hỏi từ server.");
            console.error(err);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", blob, "recording.wav");
                formData.append("questionId", question?._id);

                // Gửi câu hỏi hiện tại lên server dưới dạng JSON string
                const questionPayload = {
                    text: question.text || null,
                    context: question.context || null,
                    questions: question.questions || []
                };
                formData.append("questionData", JSON.stringify(questionPayload));

                try {
                    const res = await fetch("http://localhost:5000/api/speaking/evaluate", {
                        method: "POST",
                        body: formData,
                    });
                    const data = await res.json();
                    setResult(data);
                } catch (err) {
                    console.error("❌ Lỗi gửi audio:", err);
                }
            };


            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            alert("⚠️ Không thể truy cập micro. Vui lòng kiểm tra trình duyệt.");
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    return (
        <div className="speaking-container">
            <h2>🎙️ Luyện Speaking TOEIC (Part 1–5)</h2>

            <div className="part-buttons">
                {[1, 2, 3, 4, 5].map((p) => (
                    <button key={p} className="part-button" onClick={() => handleChangePart(p)}>
                        Part {p}
                    </button>
                ))}
            </div>

            {question && (
                <div className="question-box">
                    <h4>📘 Câu hỏi (Part {part}):</h4>
                    <p><strong>ID:</strong> {question.id}</p>
                    {question.image && (
                        <img src={question.image} alt="question" style={{ maxWidth: "300px", marginBottom: "10px" }} />
                    )}
                    {question.text && <p><strong>Text:</strong> {question.text}</p>}
                    {question.context && <p><strong>Context:</strong> {question.context}</p>}
                    {question.questions?.length > 0 && (
                        <>
                            <strong>Questions:</strong>
                            <ul>
                                {question.questions.map((q, i) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    <button onClick={() => speakText(question.text || question.context || question.questions?.[0])}>
                        🔊 Nghe lại
                    </button>
                </div>
            )}

            <div className="record-buttons">
                {recording ? (
                    <button onClick={stopRecording}>⏹ Dừng ghi âm</button>
                ) : (
                    <button onClick={startRecording} disabled={!question}>🎤 Bắt đầu ghi âm</button>
                )}
            </div>

            {result && (
                <div className="result-box">
                    <h4>📝 Transcript:</h4>
                    <p>{result.transcript}</p>
                    <h4>📊 Phản hồi từ AI:</h4>
                    <pre>{result.evaluation}</pre>
                </div>
            )}
        </div>
    );
}
