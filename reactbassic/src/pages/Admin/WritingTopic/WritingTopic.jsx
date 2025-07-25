import React, { useState, useEffect, useRef } from "react";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import axios from "axios";

const WritingTopic = () => {
  const [files, setFiles] = useState([]); // nhiều file
  const [status, setStatus] = useState("");
  const [topics, setTopics] = useState([]);
  const [activeTab, setActiveTab] = useState("part1");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef();

 useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/writing-topics");
        setTopics(res.data); // data là mảng nhiều đề
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách đề:", err);
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const fetchWritingTopics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/writing-topics");
      setTopics(res.data);
    } catch (err) {
      console.error("Lỗi khi fetch writing topics:", err);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
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

 const renderPartContent = () => {
  if (loading) return <p>⏳ Đang tải dữ liệu...</p>;
  if (!topics || topics.length === 0) return <p>Không có đề nào.</p>;

  return topics.map((topic, topicIndex) => (
    <div key={topic._id || topicIndex} style={{ marginBottom: 30 }}>
      <h3 style={{ color: "blue" }}>Đề {topicIndex + 1}</h3>

      {activeTab === "part1" && topic.part1?.length > 0 ? (
        topic.part1.map((item, idx) => (
          <div key={idx} style={styles.card}>
            <img src={item.image} alt="writing-img" style={styles.image} />
            <p><strong>Từ khóa:</strong> {item.keywords.join(", ")}</p>
            <p><strong>Số từ:</strong> {item.minWords} - {item.maxWords}</p>
          </div>
        ))
      ) : activeTab === "part1" ? (
        <p>Không có dữ liệu Part 1.</p>
      ) : null}

      {activeTab === "part2" && topic.part2?.questions?.length > 0 ? (
        topic.part2.questions.map((q, idx) => (
          <div key={idx} style={styles.card}>
            <p><strong>Email:</strong> {q.email}</p>
            <p><strong>Prompt:</strong> {q.prompt}</p>
            <p><strong>Số từ:</strong> {q.minWords} - {q.maxWords}</p>
          </div>
        ))
      ) : activeTab === "part2" ? (
        <p>Không có dữ liệu Part 2.</p>
      ) : null}

      {activeTab === "part3" && topic.part3?.question ? (
        <div style={styles.card}>
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
        <button onClick={handleUpload} style={styles.uploadButton}>Tải lên</button>
        <p>{status}</p>
      </div>

      <div className="reading-test-list">
        <button onClick={() => setActiveTab("part1")} style={activeTab === "part1" ? styles.activeTab : styles.tab}>Part 1</button>
        <button onClick={() => setActiveTab("part2")} style={activeTab === "part2" ? styles.activeTab : styles.tab}>Part 2</button>
        <button onClick={() => setActiveTab("part3")} style={activeTab === "part3" ? styles.activeTab : styles.tab}>Part 3</button>
      </div>

      <div className="reading-detail">{renderPartContent()}</div>
    </div>
  );
};

const styles = {
  tab: {
    padding: "10px 20px",
    border: "1px solid #ccc",
    background: "#f1f1f1",
    cursor: "pointer",
    borderRadius: "4px",
  },
  activeTab: {
    padding: "10px 20px",
    border: "1px solid #007bff",
    background: "#007bff",
    color: "white",
    cursor: "pointer",
    borderRadius: "4px",
  },
  card: {
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    marginBottom: "15px",
    backgroundColor: "#fafafa",
  },
  image: {
    width: "200px",
    marginBottom: "10px",
  },
  uploadButton: {
    marginLeft: "10px",
    padding: "8px 16px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default WritingTopic;
