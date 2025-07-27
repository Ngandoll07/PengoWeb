import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./SpeakingTopic.css"; // CSS riêng cho speaking

const SpeakingTopic = () => {
    const [file, setFile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const totalPages = Math.ceil(questions.length / itemsPerPage);
    const paginatedQuestions = questions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/speaking/all");
            setQuestions(res.data);
        } catch (err) {
            console.error("❌ Lỗi tải danh sách câu hỏi:", err);
        }
    };

    const handleUpload = async () => {
        if (!file) return alert("📎 Vui lòng chọn file Excel!");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post("http://localhost:5000/api/speaking/upload", formData);
            alert(`✅ Upload thành công: ${res.data.count} câu hỏi`);
            fetchQuestions();
            setCurrentPage(1);
        } catch (err) {
            console.error("❌ Upload lỗi:", err);
            alert("❌ Lỗi khi upload file");
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("⚠️ Bạn có chắc muốn xoá toàn bộ câu hỏi Speaking?")) return;
        try {
            await axios.delete("http://localhost:5000/api/speaking/clear");
            setQuestions([]);
            alert("🧹 Đã xoá toàn bộ câu hỏi");
            setCurrentPage(1);
        } catch (err) {
            console.error("❌ Lỗi xoá tất cả:", err);
            alert("❌ Không thể xoá toàn bộ dữ liệu");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xoá câu hỏi này?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/speaking/${id}`);
            setQuestions(prev => prev.filter(q => q._id !== id));
        } catch (err) {
            console.error("❌ Lỗi xoá câu hỏi:", err);
            alert("❌ Xoá thất bại");
        }
    };

    return (
        <div className="speaking-admin-wrapper">
            <AdminHeader />
            <h2 className="manage-speaking-title">🗣️ Quản lý đề Speaking TOEIC</h2>

            {/* Khu vực upload */}
            <div className="speaking-upload-section">
                <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} />
                <button onClick={handleUpload} style={{ marginRight: "10px" }}>📤 Tải lên</button>
                <button
                    onClick={handleClearAll}
                    style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "6px"
                    }}
                >
                    🗑 Xoá tất cả
                </button>
            </div>

            {/* Dropdown chọn số dòng/trang */}
            <div style={{ margin: "10px 300px" }}>
                <label htmlFor="per-page-select" style={{ marginRight: "10px" }}>
                    Hiển thị mỗi trang:
                </label>
                <select
                    id="per-page-select"
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    <option value={10}>10 dòng</option>
                    <option value={20}>20 dòng</option>
                    <option value={50}>50 dòng</option>
                </select>
            </div>

            {/* Bảng danh sách đề Speaking */}
            <div className="speaking-detail">
                <h3>📋 Tổng số: {questions.length} câu</h3>
                <table className="speaking-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Part</th>
                            <th>ID</th>
                            <th>Text</th>
                            <th>Image</th>
                            <th>Image Description</th>
                            <th>Context</th>
                            <th>Câu hỏi phụ</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedQuestions.map((q, idx) => (
                            <tr key={q._id}>
                                <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                <td>{q.part}</td>
                                <td>{q.id}</td>
                                <td>{q.text || "-"}</td>
                                <td>{q.image ? <a href={`/${q.image}`} target="_blank" rel="noreferrer">🔗</a> : "-"}</td>
                                <td>{q.imageDescription || "-"}</td>
                                <td>{q.context || "-"}</td>
                                <td>
                                    {q.questions && q.questions.length > 0
                                        ? q.questions.map((qq, i) => <div key={i}>• {qq}</div>)
                                        : "-"}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(q._id)}
                                        style={{
                                            backgroundColor: "#dc3545",
                                            color: "white",
                                            border: "none",
                                            padding: "6px 10px",
                                            borderRadius: "4px"
                                        }}
                                    >
                                        Xoá
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {questions.length > itemsPerPage && (
                    <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            ⏮ Trước
                        </button>
                        <span>Trang {currentPage} / {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            ⏭ Tiếp
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpeakingTopic;
