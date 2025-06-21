import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./ListeningTopic.css";

const ListeningTopic = () => {
    const [questions, setQuestions] = useState([]);
    const [selectedPart, setSelectedPart] = useState(1);
    const [jsonFile, setJsonFile] = useState(null);

    useEffect(() => {
        loadQuestions(selectedPart);
    }, [selectedPart]);

    const loadQuestions = async (part) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/listening-tests/part/${part}`);
            setQuestions(res.data);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        }
    };

    const handleUpload = async () => {
        if (!jsonFile) return alert("Vui lòng chọn file JSON");

        const formData = new FormData();
        formData.append("file", jsonFile);

        try {
            const res = await axios.post("http://localhost:5000/api/upload-listening", formData);
            alert(`✅ Đã upload ${res.data.count} câu hỏi`);
            loadQuestions(selectedPart); // reload
        } catch (err) {
            alert("❌ Upload thất bại");
        }
    };

    return (
        <div className="listening-admin-wrapper">
            <AdminHeader />
            <h2 className="manage-listening-title">🎧 Quản lý đề luyện nghe</h2>

            <div className="upload-listening-json">
                <input type="file" accept=".json" onChange={(e) => setJsonFile(e.target.files[0])} />
                <button onClick={handleUpload}>📤 Tải lên file JSON</button>
            </div>

            <div className="listening-part-select">
                {[1, 2, 3, 4].map((p) => (
                    <button
                        key={p}
                        className={selectedPart === p ? "active" : ""}
                        onClick={() => setSelectedPart(p)}
                    >
                        Part {p}
                    </button>
                ))}
            </div>

            {/* ⚠️ Scrollable table container */}
            <div className="table-scroll-wrapper">
                <table className="listening-table">

                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Câu hỏi</th>
                            <th>A</th>
                            <th>B</th>
                            <th>C</th>
                            <th>D</th>
                            <th>Đáp án</th>
                            <th>Audio</th>
                            <th>Ảnh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((q, idx) => (
                            <tr key={q.id}>
                                <td>{idx + 1}</td>
                                <td>{q.question}</td>
                                <td>{q.options?.A}</td>
                                <td>{q.options?.B}</td>
                                <td>{q.options?.C}</td>
                                <td>{q.options?.D}</td>
                                <td><b>{q.answer}</b></td>
                                <td>
                                    <audio controls style={{ width: "160px" }} src={q.audio} />
                                </td>
                                <td>{q.image ? <img src={q.image} alt="" width="60" /> : "–"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListeningTopic;
