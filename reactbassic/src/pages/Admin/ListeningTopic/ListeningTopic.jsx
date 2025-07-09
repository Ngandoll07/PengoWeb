import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./ListeningTopic.css";

const ITEMS_PER_PAGE = 10;

const ListeningTopic = () => {
    const [questions, setQuestions] = useState([]);
    const [selectedPart, setSelectedPart] = useState(1);
    const [selectedLevel, setSelectedLevel] = useState("");
    const [excelFile, setExcelFile] = useState(null);
    const [sheetName, setSheetName] = useState("");
    const [sheetOptions, setSheetOptions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false); // ✅ Sửa lỗi: thêm dòng này

    useEffect(() => {
        loadQuestions(selectedPart, selectedLevel);
    }, [selectedPart, selectedLevel]);

    const loadQuestions = async (part, level) => {
        setLoading(true); // ✅ Bắt đầu tải
        try {
            let url = `http://localhost:5000/api/listening-tests/part/${part}`;
            if (level) url += `?level=${level}`;
            const res = await axios.get(url);
            setQuestions(res.data);
            setCurrentPage(1);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            alert("Không thể tải dữ liệu câu hỏi.");
        }
        setLoading(false); // ✅ Kết thúc tải
    };

    const handleExcelSelect = async (e) => {
        const file = e.target.files[0];
        setExcelFile(file);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await axios.post("http://localhost:5000/api/listening/sheets", formData);
            setSheetOptions(res.data.sheets);
        } catch (err) {
            alert("❌ Không thể lấy danh sách sheet");
        }
    };

    const handleUploadExcel = async () => {
        if (!excelFile || !sheetName) return alert("Vui lòng chọn file Excel và sheet");
        const formData = new FormData();
        formData.append("file", excelFile);
        formData.append("sheetName", sheetName);
        try {
            const res = await axios.post("http://localhost:5000/api/upload-excel-listening", formData);
            alert(`✅ Đã upload ${res.data.count} câu hỏi`);
            loadQuestions(selectedPart, selectedLevel);
        } catch (err) {
            alert("❌ Upload Excel thất bại");
        }
    };

    const handleClear = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xoá toàn bộ câu hỏi?")) return;
        try {
            await axios.delete("http://localhost:5000/api/listening/clear");
            alert("🧹 Đã xoá toàn bộ câu hỏi");
            loadQuestions(selectedPart, selectedLevel);
        } catch (err) {
            alert("❌ Xoá thất bại");
        }
    };

    const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
    const paginatedQuestions = questions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="listening-admin-wrapper1">
            <AdminHeader />
            <h2 className="manage-listening-title1">🎧 Quản lý đề luyện nghe</h2>

            <div className="upload-listening-excel">
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelSelect} />
                <select value={sheetName} onChange={(e) => setSheetName(e.target.value)}>
                    <option value="">-- Chọn sheet --</option>
                    {sheetOptions.map((s, i) => (
                        <option key={i} value={s}>{s}</option>
                    ))}
                </select>
                <button onClick={handleUploadExcel}>📤 Tải lên file Excel và phân tích</button>
            </div>

            <button onClick={handleClear} style={{ backgroundColor: "crimson", color: "white", marginLeft: 300 }}>
                🗑 Xoá toàn bộ
            </button>

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

            <div className="level-filter">
                <label>Độ khó:</label>
                <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                    <option value="">Tất cả</option>
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                </select>
            </div>

            {loading ? (
                <p>⏳ Đang tải dữ liệu...</p>
            ) : (
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
                                <th>Transcript</th>
                                <th>Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedQuestions.map((q, idx) => (
                                <tr key={q.id}>
                                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                    <td>{q.question}</td>
                                    <td>{q.options?.A}</td>
                                    <td>{q.options?.B}</td>
                                    <td>{q.options?.C}</td>
                                    <td>{q.options?.D}</td>
                                    <td><b>{q.answer}</b></td>
                                    <td><audio controls style={{ width: "160px" }} src={q.audio} /></td>
                                    <td>{q.image ? <img src={q.image} alt="" width="60" /> : "–"}</td>
                                    <td className="transcript-cell">{q.transcript || "–"}</td>
                                    <td>{q.level || "–"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                className={currentPage === i + 1 ? "active" : ""}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListeningTopic;
