import React, { useState } from "react";
import "./CourseCard.css";
import CoursePreviewModal from "./CoursePreviewModal";
import { useCart } from "../../context/CartContext"; // Thêm dòng này

export default function CourseCard({ course }) {
    const [showModal, setShowModal] = useState(false);
    const { addToCart } = useCart(); // Lấy hàm từ context

    return (
        <>
            <div className="course-card">
                {course.tag && <div className="course-badge">{course.tag}</div>}
                <img src={course.image} alt={course.title} className="course-image" />
                <div className="course-content">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    <div className="course-price">
                        {course.originalPrice && (
                            <span className="original-price">
                                {course.originalPrice.toLocaleString("vi-VN")} ₫
                            </span>
                        )}
                        <span className="current-price">
                            {course.price.toLocaleString("vi-VN")} ₫
                        </span>
                    </div>
                    <div className="course-actions">
                        <button className="preview-button" onClick={() => setShowModal(true)}>
                            Xem trước
                        </button>
                        <button
                            className="buy-button"
                            onClick={() => addToCart(course)}
                        >
                            Mua ngay
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <CoursePreviewModal course={course} onClose={() => setShowModal(false)} />
            )}
        </>
    );
}
