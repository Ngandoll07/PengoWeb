import React, { useState, useEffect, useRef } from "react";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import axios from "axios";
import './WritingTopic.css';

const WritingTopic = () => {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [topics, setTopics] = useState([]);
  const [activeTab, setActiveTab] = useState("part1");
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchWritingTopics();
  }, []);

  const fetchWritingTopics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/writing-topics");
      setTopics(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đề:", err);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) {
      setStatus("❌ Vui lòng chọn ít nhất một file Excel");
      return;
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
          await axios.post("http://localhost:5000/api/upload-writing", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return { success: true };
        } catch (error) {
          console.error("Lỗi khi upload file:", file.name, error);
          return { success: false, name: file.name };
        }
      })
    );

    const failedFiles = uploadResults.filter((res) => !res.success);
    if (failedFiles.length === 0) {
      setStatus(`✅ Đã tải lên ${files.length} đề thành công!`);
    } else {
      const failedNames = failedFiles.map((f) => f.name).join(", ");
      setStatus(`❌ Lỗi khi upload các file sau: ${failedNames}`);
    }

    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
    fetchWritingTopics();
  };

  const handleDelete = async (topicId) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa đề này?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/writing-topics/${topicId}`);
      setStatus("✅ Đã xóa đề thành công.");
      fetchWritingTopics();
    } catch (error) {
      console.error("Lỗi khi xóa đề:", error);
      setStatus("❌ Xóa đề thất bại.");
    }
  };

  const toggleSelectTopic = (id) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const renderPartContent = () => {
    if (loading) return <p>⏳ Đang tải dữ liệu...</p>;
    if (!topics.length) return <p>Không có đề nào.</p>;

    return topics.map((topic, topicIndex) => (
      <div key={topic._id || topicIndex} style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ color: "blue" }}>Đề {topicIndex + 1}</h3>
          <div className="topic-actions">
  <label className="custom-checkbox">
    <input
      type="checkbox"
      checked={selectedTopics.includes(topic._id)}
      onChange={() => toggleSelectTopic(topic._id)}
    />
    <span className="checkmark"></span>
    Chọn để xóa
  </label>

  <button className="delete-button" onClick={() => handleDelete(topic._id)}>
    🗑 Xóa
  </button>
</div>

        </div>

        {activeTab === "part1" && topic.part1?.length > 0 ? (
          topic.part1.map((item, idx) => (
            <div key={idx} className="card1">
              <img src={item.image} alt="writing-img" className="card-image" />
              <p><strong>Từ khóa:</strong> {item.keywords.join(", ")}</p>
              <p><strong>Số từ:</strong> {item.minWords} - {item.maxWords}</p>
            </div>
          ))
        ) : activeTab === "part1" ? (
          <p>Không có dữ liệu Part 1.</p>
        ) : null}

        {activeTab === "part2" && topic.part2?.questions?.length > 0 ? (
          topic.part2.questions.map((q, idx) => (
            <div key={idx} className="card1">
              <p><strong>Email:</strong> {q.email}</p>
              <p><strong>Prompt:</strong> {q.prompt}</p>
              <p><strong>Số từ:</strong> {q.minWords} - {q.maxWords}</p>
            </div>
          ))
        ) : activeTab === "part2" ? (
          <p>Không có dữ liệu Part 2.</p>
        ) : null}

        {activeTab === "part3" && topic.part3?.question ? (
          <div className="card1">
            <p><strong>Prompt:</strong> {topic.part3.question.prompt}</p>
            <p><strong>Số từ:</strong> {topic.part3.question.minWords} - {topic.part3.question.maxWords}</p>
          </div>
        ) : activeTab === "part3" ? (
          <p>Không có dữ liệu Part 3.</p>
        ) : null}
      </div>
    ));
  };

  return (
    <div className="reading-admin-wrapper">
      <AdminHeader />
      <h2 className="manage-reading-title">📤 Upload Đề Writing (gồm Part 1, 2, 3)</h2>

      <div className="reading-upload-section">
        <input
          type="file"
          accept=".xlsx, .xls"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        <button onClick={handleUpload} className="upload-button">Tải lên</button>
        <p>{status}</p>
      </div>

      <div className="reading-test-list">
        <button onClick={() => setActiveTab("part1")} className={activeTab === "part1" ? "active-tab1" : "tab1"}>Part 1</button>
        <button onClick={() => setActiveTab("part2")} className={activeTab === "part2" ? "active-tab1" : "tab1"}>Part 2</button>
        <button onClick={() => setActiveTab("part3")} className={activeTab === "part3" ? "active-tab1" : "tab1"}>Part 3</button>
      </div>

      <div className="reading-detail">
        {renderPartContent()}
      </div>
    </div>
  );
};

export default WritingTopic;
