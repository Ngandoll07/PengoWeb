import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./LisnReadTopic.css";

const ITEMS_PER_PAGE = 10;

const LisnReadTopic = () => {
  const [questions, setQuestions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPart, setSelectedPart] = useState("");

  // 👇 thêm state để hiển thị thông báo
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"

  const handleExcelSelect = (e) => {
    const file = e.target.files[0];
    if (file) setExcelFile(file);
  };

  const handleUpload = async () => {
    if (!excelFile) {
      setMessage("⚠️ Vui lòng chọn file Excel trước!");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      const res = await fetch("http://localhost:5000/api/upload-excel-reading", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Upload thành công! Đã lưu dữ liệu từ file: ${excelFile.name}`);
        setMessageType("success");
        fetchQuestions();
      } else {
        setMessage(`❌ Upload thất bại: ${data?.message || "Có lỗi xảy ra"}`);
        setMessageType("error");
      }
    } catch (err) {
      console.error("❌ Upload lỗi:", err);
      setMessage("❌ Upload file thất bại. Không thể kết nối server.");
      setMessageType("error");
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/upload-excel-reading/lisnread-tests"
      );
      setQuestions(res.data || []);
    } catch (err) {
      console.error("❌ Không thể lấy danh sách:", err);
      setMessage("❌ Không thể lấy danh sách câu hỏi.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const groupedByPart = useMemo(() => {
    return questions.reduce((acc, q) => {
      const partKey = String(q.part ?? "Unknown");
      if (!acc[partKey]) acc[partKey] = [];
      acc[partKey].push(q);
      return acc;
    }, {});
  }, [questions]);

  const partOptions = useMemo(() => {
    const keys = Object.keys(groupedByPart);
    const numeric = keys.every((k) => !isNaN(Number(k)));
    return numeric ? keys.sort((a, b) => Number(a) - Number(b)) : keys.sort();
  }, [groupedByPart]);

  const currentPart = selectedPart || partOptions[0] || "";
  const allQuestions = groupedByPart[currentPart] || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [currentPart, allQuestions.length]);

  const totalPages = Math.max(1, Math.ceil(allQuestions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuestions = allQuestions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="listening-admin-wrapper">
      <AdminHeader />
      <h2 className="manage-reading-title">📖 Quản lý đề Reading/Listening</h2>

      {/* ✅ Thông báo */}
      {message && (
        <div className={`alert ${messageType}`}>
          {message}
        </div>
      )}

      {/* Upload Excel */}
      <div className="upload-listening-excel">
        <input type="file" accept=".xlsx,.xls" onChange={handleExcelSelect} />
        <button onClick={handleUpload}>📤 Upload</button>
      </div>

      {/* Chọn Part */}
      <div className="part-select">
        <label>Chọn Part: </label>
        <select
          value={currentPart}
          onChange={(e) => {
            setSelectedPart(e.target.value);
            setCurrentPage(1);
          }}
        >
          {partOptions.map((p) => (
            <option key={p} value={p}>
              {`Part ${p} (${groupedByPart[p]?.length || 0} câu)`}
            </option>
          ))}
        </select>
      </div>

      {/* Bảng câu hỏi */}
      {loading ? (
        <p className="loading">⏳ Đang tải dữ liệu...</p>
      ) : currentPart ? (
        <div className="part-section">
          <div className="part-header">
            <h3 className="part-title">
              📌 Part {currentPart} — Tổng cộng {allQuestions.length} câu
            </h3>
            <span className="page-info">
              Trang {currentPage}/{totalPages}
            </span>
          </div>

          <div className="table-scroll-wrapper1">
            <table className="listening-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Câu hỏi</th>
                  <th>Đáp án</th>
                  <th>Audio</th>
                  <th>Ảnh</th>
                  <th>Passage</th>
                  <th>Transcript</th>
                  <th>Label</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuestions.map((q, idx) => (
                  <tr key={q._id || q.questionId || idx}>
                    <td>{startIndex + idx + 1}</td>
                    <td>{q.questionText || "–"}</td>
                    <td><b>{q.answerAdmin || "–"}</b></td>
                    <td>
                      {q.audioPath ? (
                        <audio controls style={{ width: "160px" }} src={q.audioPath} />
                      ) : (
                        "–"
                      )}
                    </td>
                    <td>
                      {q.imagePath ? (
                        <img src={q.imagePath} alt="" width="60" />
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="passage-cell">{q.passage || "–"}</td>
                    <td className="transcript-cell">{q.transcript || "–"}</td>
                    <td>{q.label || "–"}</td>
                    <td>{q.explanation || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>❌ Không có dữ liệu Part nào</p>
      )}
    </div>
  );
};

export default LisnReadTopic;
