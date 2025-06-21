import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./UploadLessonPage.css";

const UploadLessonPage = () => {
  const [title, setTitle] = useState("");
  const [part, setPart] = useState("");
  const [level, setLevel] = useState("easy");
  const [skill, setSkill] = useState("reading");
  const [day, setDay] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/lessons")
      .then(res => {
        setLessons(res.data);
        if (res.data.length > 0) setSelectedLesson(res.data[0]);
      })
      .catch(err => console.error("❌ Lỗi lấy danh sách bài học:", err));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("⚠️ Vui lòng chọn file Excel");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("part", part);
      formData.append("level", level);
      formData.append("skill", skill);
      if (day) formData.append("day", day);

      const res = await axios.post("http://localhost:5000/api/upload-lesson", formData);
      setMessage("✅ " + res.data.message);

      // Refresh danh sách
      const updated = await axios.get("http://localhost:5000/api/lessons");
      setLessons(updated.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Lỗi khi upload bài học");
    }
  };

  return (
    <div className="reading-admin-wrapper">
         <AdminHeader />
 <div className="upload-container">
     
      <h2>🧑‍🏫 Admin: Đăng bài học theo Part</h2>
      <form onSubmit={handleUpload} encType="multipart/form-data">
        <label>📄 Tiêu đề bài học</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>🧩 Part</label>
        <input type="number" min="1" max="7" value={part} onChange={(e) => setPart(e.target.value)} required />

        <label>🎯 Level</label>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>

        <label>📚 Kỹ năng</label>
        <select value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="reading">Reading</option>
          <option value="listening">Listening</option>
        </select>

        <label>📅 Gán cho ngày (nếu có)</label>
        <input type="number" value={day} onChange={(e) => setDay(e.target.value)} placeholder="Có thể để trống" />

        <label>📁 File Excel</label>
        <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])} required />

        <button type="submit">🚀 Upload</button>
      </form>

      {message && <p className="message">{message}</p>}

     
    </div>
     <h3>📋 Danh sách bài học đã upload</h3>
      <div className="lesson-list">
        {lessons.map((lesson) => (
          <div
            key={lesson._id}
            className={`lesson-card ${selectedLesson?._id === lesson._id ? "active" : ""}`}
            onClick={() => setSelectedLesson(lesson)}
          >
            <h4>{lesson.title}</h4>
            <p>Part {lesson.part} • {lesson.questions.length} câu</p>
          </div>
        ))}
      </div>

      {selectedLesson && (
        <div className="lesson-detail">
          <h3>📖 {selectedLesson.title}</h3>
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
              </tr>
            </thead>
            <tbody>
             {selectedLesson.questions.map((block, blockIndex) =>
                block.questions?.map((q, idx) => (
                    <tr key={`${blockIndex}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{q.question}</td>
                    <td>{q.options?.[0]}</td>
                    <td>{q.options?.[1]}</td>
                    <td>{q.options?.[2]}</td>
                    <td>{q.options?.[3]}</td>
                    <td><b>{q.answer}</b></td>
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

export default UploadLessonPage;
