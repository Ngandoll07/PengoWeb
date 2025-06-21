import React from "react";
import "./CoursePreviewModal.css";
import { useCart } from "../../context/CartContext"; // Đảm bảo đường dẫn đúng

export default function CoursePreviewModal({ course, onClose }) {
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart(course);
        alert("✅ Đã thêm vào giỏ hàng!");
        onClose(); // Đóng modal sau khi thêm
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <button className="modal-close" onClick={onClose}>×</button>

                {/* BÊN TRÁI: Hình ảnh khóa học */}
                <div className="modal-left">
                    <img src={course.image} alt={course.title} className="modal-image" />
                </div>

                {/* BÊN PHẢI: Thông tin khóa học */}
                <div className="modal-info">
                    <h2 className="modal-title">{course.title}</h2>
                    <div className="modal-price">
                        {course.originalPrice && (
                            <span className="modal-original-price">
                                {course.originalPrice.toLocaleString("vi-VN")} ₫
                            </span>
                        )}
                        <span className="modal-current-price">
                            {course.price.toLocaleString("vi-VN")} ₫
                        </span>
                    </div>

                    <p className="modal-description"><strong>Khoá học gồm:</strong></p>
                    <ul>
                        {(course.details || []).map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>

                    <button className="add-to-cart-button" onClick={handleAddToCart}>
                        Thêm vào giỏ hàng
                    </button>
                </div>
            </div>
        </div>
    );
}
