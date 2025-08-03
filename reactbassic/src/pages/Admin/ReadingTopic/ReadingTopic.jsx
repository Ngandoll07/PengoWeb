import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./ReadingTopic.css";

const ReadingTopic = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [part, setPart] = useState(5);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/reading-tests")
      .then((res) => {
        setTests(res.data);
        if (res.data.length > 0) {
          setSelectedTest(res.data[0]);
        }
      })
      .catch((err) => console.error("❌ Lỗi lấy danh sách đề:", err));
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !title || !part) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("part", part);

    try {
      const res = await axios.post("http://localhost:5000/api/upload-reading", formData);
      alert("✅ Tải lên thành công!");
      setTests((prev) => [...prev, res.data]); // append test mới
    } catch (err) {
      console.error("❌ Upload thất bại:", err);
      alert("❌ Upload thất bại!");
    }
  };

  return (
    <div className="reading-admin-wrapper">
      <AdminHeader />
      <h2 className="manage-reading-title">📚 Quản lý đề luyện đọc (Reading)</h2>

      {/* 📤 Upload Section */}
      <div className="reading-upload-section">
        <input
          type="text"
          placeholder="Nhập tiêu đề đề đọc (VD: Reading Part 6 - Đề A)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select value={part} onChange={(e) => setPart(parseInt(e.target.value))}>
          <option value={5}>Part 5</option>
          <option value={6}>Part 6</option>
          <option value={7}>Part 7</option>
        </select>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <button onClick={handleUpload}>📤 Tải lên</button>
      </div>

      {/* 📑 Danh sách đề đã tải */}
      <div className="reading-test-list">
        {tests.map((test) => {
          const totalQuestions =
            test.questions?.length || test.blocks?.reduce((sum, b) => sum + b.questions.length, 0) || 0;

          return (
            <div
              key={test._id}
              className={`reading-test-card ${selectedTest?._id === test._id ? "active" : ""}`}
              onClick={() => setSelectedTest(test)}
            >
              <h4>{test.title}</h4>
              <p>{totalQuestions} câu hỏi</p>
              <p className="difficulty-tag">📊 Đã phân tích độ khó</p>
            </div>
          );
        })}
      </div>

      {/* 📘 Chi tiết đề đã chọn */}
      {selectedTest && (
        <div className="reading-detail">
          <h3>📖 {selectedTest.title}</h3>
          <table className="reading-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Câu hỏi</th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
                <th>Đáp án</th>
                <th>Part</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {/* 📌 Part 5 - dạng câu rời */}
              {selectedTest.questions?.map((q, idx) => (
                <tr key={`q-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{q.question}</td>
                  <td>{q.options?.A}</td>
                  <td>{q.options?.B}</td>
                  <td>{q.options?.C}</td>
                  <td>{q.options?.D}</td>
                  <td><b>{q.answer}</b></td>
                  <td>{selectedTest.part}</td>
                  <td>{q.level || "?"}</td>
                </tr>
              ))}

              {/* 📌 Part 6 & 7 - block with passage */}
              {selectedTest.blocks?.map((block, blockIdx) =>
                block.questions.map((q, idx) => (
                  <tr key={`b-${blockIdx}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>
                      <div><b>Đoạn văn:</b> {block.passage || "Không có đoạn văn"}</div>
                      <div><b>Câu hỏi:</b> {q.question}</div>
                    </td>
                    <td>{q.options?.A}</td>
                    <td>{q.options?.B}</td>
                    <td>{q.options?.C}</td>
                    <td>{q.options?.D}</td>
                    <td><b>{q.answer}</b></td>
                    <td>{selectedTest.part}</td>
                    <td>{q.level || "?"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReadingTopic;
