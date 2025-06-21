import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./CourseAdmin.css";

const CourseAdmin = () => {
    const [courses, setCourses] = useState([]);
    const [jsonFile, setJsonFile] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/courses");
            setCourses(res.data);
        } catch (err) {
            console.error("Lỗi tải danh sách khoá học:", err);
        }
    };

    const handleUpload = async () => {
        if (!jsonFile) return alert("Vui lòng chọn file JSON");

        const formData = new FormData();
        formData.append("file", jsonFile);

        try {
            const res = await axios.post("http://localhost:5000/api/upload-courses", formData);
            alert(`✅ Đã upload ${res.data.count} khoá học`);
            fetchCourses();
        } catch (err) {
            alert("❌ Upload thất bại");
        }
    };

    return (
        <div className="course-admin-wrapper">
            <AdminHeader />
            <h2 className="manage-course-title">📚 Quản lý khoá học</h2>

            <div className="upload-course-json">
                <input type="file" accept=".json" onChange={(e) => setJsonFile(e.target.files[0])} />
                <button onClick={handleUpload}>📤 Tải lên file JSON</button>
            </div>

            <div className="table-scroll-wrapper">
                <table className="course-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Tiêu đề</th>
                            <th>Mô tả</th>
                            <th>Giá</th>
                            <th>Giá gốc</th>
                            <th>Ảnh</th>
                            <th>Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course, idx) => (
                            <tr key={course.id}>
                                <td>{idx + 1}</td>
                                <td>{course.title}</td>
                                <td>{course.description}</td>
                                <td>{course.price.toLocaleString("vi-VN")} ₫</td>
                                <td>{course.originalPrice ? course.originalPrice.toLocaleString("vi-VN") + " ₫" : "–"}</td>
                                <td>
                                    <img src={course.image} alt="course" width="80" />
                                </td>
                                <td>
                                    <ul>
                                        {(course.details || []).map((d, i) => (
                                            <li key={i}>{d}</li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseAdmin;
