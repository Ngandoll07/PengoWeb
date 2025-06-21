import React, { useEffect, useState } from "react";
import "./CoursesPage.css";
import CourseCard from "../../components/CourseCard/CourseCard";

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetch("/data/courses.json")
            .then((res) => res.json())
            .then((data) => setCourses(data))
            .catch((err) => console.error("Lỗi tải dữ liệu khoá học:", err));
    }, []);

    return (
        <div className="courses-page">
            <h1 className="page-title">Cửa hàng</h1>
            <div className="course-grid">
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    );
}
