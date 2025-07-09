import React, { useEffect, useState } from "react";
import './RoadmapPage.css';
import { useNavigate,useLocation } from "react-router-dom";
import Footer from "../../components/FooterComponents/FooterComponent";
import axios from "axios";

const RoadmapPage = () => {
  const [learningData, setLearningData] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

useEffect(() => {
  const fetchPlan = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/recommend", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("📦 Lộ trình từ API:", data);

      if (Array.isArray(data.suggestion)) {
        setLearningData(data.suggestion);
      } else {
        setLearningData([]);
      }

      setAnalysis(data.analysis || "");
    } catch (err) {
      console.error("❌ Lỗi khi fetch lộ trình:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchPlan(); // gọi mỗi lần component mount

  // Nếu có flag updated từ PracticeLessonPage ➝ reset state để không lặp
  if (location.state?.updated) {
    navigate("/roadmap", { replace: true }); // reset state
  }
}, [location.state]);





const handleDayClick = async (item) => {
  try {
    const res = await axios.post("http://localhost:5000/api/generate-lesson", {
      day: item.day,
      skill: item.skill,
    });

    const lesson = res.data.lesson;

    if (!item._id) {
      console.warn("❌ Không có _id trong roadmap item!", item);
    }

    navigate("/practicelesson/ai", {
      state: {
        lesson,
        day: item.day,
        roadmapItemId: item._id || null, // đảm bảo không undefined
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo bài học:", err);
    alert("⚠️ Không thể tạo bài học từ AI.");
  }
};





  return (
    <div className="learning-path">
      <h2>Lộ trình học của bạn</h2>

      {loading ? (
        <p>Đang tải lộ trình từ AI...</p>
      ) : (
        <>
          <div className="analysis-box">
            <h3>📊 Phân tích:</h3>
            <p style={{ whiteSpace: "pre-line" }}>{analysis}</p>
          </div>

          <div className="day-list">
            {learningData.map((item, index) => (
              <div
                key={index}
                className={`day-card ${item.skill}`}
             onClick={() => handleDayClick(item)}
              >
                <h3>Day {item.day}</h3>
                <p>{item.title}</p>
                <p>Kỹ năng: {item.skill}</p>

                <div className={`status ${item.status}`}>
                  <span className="sub-progress">{item.progress}%</span>
                  <span className="status-label">
                    {item.status === "done" ? "✅ Hoàn thành" : "⚠️ Chưa hoàn thành"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Footer />
        </>
      )}
    </div>
  );
};

export default RoadmapPage;