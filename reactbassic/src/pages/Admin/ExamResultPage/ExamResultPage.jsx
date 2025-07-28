import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./ExamResultPage.css";
import { FaTrash } from "react-icons/fa"; // 👈 Import icon thùng rác

const ManageTestResults = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = () => {
    axios
      .get("http://localhost:5000/api/test-results")
      .then((res) => setResults(res.data))
      .catch((err) => console.error("Lỗi lấy kết quả:", err));
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xoá kết quả này?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/test-results/${id}`);
      setResults(results.filter((r) => r._id !== id)); // Cập nhật UI
    } catch (error) {
      console.error("Lỗi xoá kết quả:", error);
      alert("Xóa thất bại!");
    }
  };

  return (
    <div className="result-admin-wrapper">
      <AdminHeader />
      <h2 className="manage-result-title">Quản lý kết quả Listening & Reading</h2>
      <div className="result-card">
        <table className="result-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Đúng</th>
              <th>Sai</th>
              <th>Bỏ qua</th>
              <th>Điểm</th>
              <th>Nghe</th>
              <th>Đọc</th>
              <th>Thời gian</th>
              <th>Ngày làm bài</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, index) => (
              <tr key={r._id || index}>
                <td>{index + 1}</td>
                <td>{r.userId?.email || "Ẩn danh"}</td>
                <td>{r.correct}</td>
                <td>{r.incorrect}</td>
                <td>{r.skipped}</td>
                <td>{r.score}</td>
                <td>{r.listeningScore}</td>
                <td>{r.readingScore}</td>
                <td>{r.time}</td>
                <td>{new Date(r.createdAt).toLocaleString("vi-VN")}</td>
                <td>
                   <button
                        className="delete-icon-btn"
                        onClick={() => handleDelete(r._id)}
                        >
                        <FaTrash />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageTestResults;
