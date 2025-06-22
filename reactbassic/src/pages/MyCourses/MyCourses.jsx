// src/pages/MyCourses/MyCourses.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyCourses.css";

export default function MyCourses() {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const fetchMyCourses = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5000/api/purchase/my-courses", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setCourses(res.data);
            } catch (err) {
                console.error("❌ Lỗi tải khoá học:", err);
            }
        };

        fetchMyCourses();
    }, []);

    return (
        <div className="my-courses-wrapper">
            <h2>📚 Khoá học đã mua</h2>
            {courses.length === 0 ? (
                <p>Bạn chưa mua khoá học nào.</p>
            ) : (
                <div className="my-course-grid">
                    {courses.map((course) => (
                        <div key={course.id} className="my-course-card">
                            <img src={course.image} alt={course.title} />
                            <h3>{course.title}</h3>
                            <p>{course.description}</p>
                            <ul>
                                {(course.details || []).map((d, idx) => (
                                    <li key={idx}>{d}</li>
                                ))}
                            </ul>
                            <div className="my-course-price">
                                {course.originalPrice && (
                                    <span className="original">
                                        {course.originalPrice.toLocaleString("vi-VN")} ₫
                                    </span>
                                )}
                                <span className="current">
                                    {course.price.toLocaleString("vi-VN")} ₫
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
