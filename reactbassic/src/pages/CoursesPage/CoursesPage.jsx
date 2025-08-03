import React, { useEffect, useState, useMemo } from "react";
import CourseCard from "../../components/CourseCard/CourseCard";
import Footer from "../../components/FooterComponents/FooterComponent";
import "./CoursesPage.css";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/data/courses.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCourses(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải dữ liệu khoá học:", err);
        setError("Không thể tải khoá học. Thử lại sau.");
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [courses]);

  useEffect(() => {
    let result = [...courses];
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [search, categoryFilter, courses]);

  return (
    <div className="courses-page">
      <div className="container">
<div className="header">
  <h1 className="hero-title">Cửa hàng khóa học</h1>
  <p className="hero-subtitle">Khám phá và chọn khoá học phù hợp với bạn.</p>

</div>
        <div className="search-wrapper">
  <div className="search-input-container">
    <input
      aria-label="Tìm kiếm khoá học"
      type="text"
      placeholder="Tìm kiếm..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="search-input"
    />
    <div className="search-icon" aria-hidden="true">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16.65" y1="16.65" x2="21" y2="21" />
      </svg>
    </div>
  </div>
</div>


      {loading && (
        <div className="course-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton image" />
              <div className="skeleton title" />
              <div className="skeleton desc" />
              <div className="skeleton button" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetch("/data/courses.json")
                .then((res) => res.json())
                .then((data) => {
                  setCourses(data);
                  setFiltered(data);
                  setLoading(false);
                })
                .catch((err) => {
                  console.error(err);
                  setError("Không thể tải lại. Vui lòng thử lại sau.");
                  setLoading(false);
                });
            }}
            className="button"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <p className="no-results-title">Không tìm thấy khoá học nào.</p>
          <p>Thử thay đổi từ khoá hoặc bộ lọc.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="course-grid">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
      </div>
      <Footer/>
    </div>
  );
}
