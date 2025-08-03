import React, { useState } from "react";
import "./CourseCard.css";
import CoursePreviewModal from "./CoursePreviewModal";
import { useCart } from "../../context/CartContext";

export default function CourseCard({ course }) {
  const [showModal, setShowModal] = useState(false);
  const { addToCart } = useCart();

  const hasDiscount =
    course.originalPrice && course.price < course.originalPrice;

  const formatPrice = (value) =>
    value?.toLocaleString("vi-VN", { minimumFractionDigits: 0 });

  return (
    <>
      <div className="course-card">
        {course.tag && <div className="course-badge">{course.tag}</div>}
        {hasDiscount && (
          <div className="discount-badge">
            Giảm {Math.round(
              ((course.originalPrice - course.price) / course.originalPrice) *
                100
            )}
            %
          </div>
        )}

        <div className="image-wrapper">
          <img
            src={course.image}
            alt={course.title}
            className="course-image"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="course-content">
          <h3 className="course-title">{course.title}</h3>
          <p className="course-description">
            {course.description || "Chưa có mô tả."}
          </p>

          <div className="course-price">
            {hasDiscount && (
              <span className="original-price">
                {formatPrice(course.originalPrice)}₫
              </span>
            )}
            <span className="current-price">
              {formatPrice(course.price)}₫
            </span>
          </div>

          <div className="course-actions">
            <button
              aria-label={`Xem trước khoá học ${course.title}`}
              className="preview-button"
              onClick={() => setShowModal(true)}
              type="button"
            >
              Xem trước
            </button>
            <button
              aria-label={`Mua khoá học ${course.title}`}
              className="buy-button"
              onClick={() => addToCart(course)}
              type="button"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <CoursePreviewModal
          course={course}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
