import React, { useEffect, useState } from "react";
import './RoadmapPage.css';
import { useNavigate } from "react-router-dom";
import Footer from "../../components/FooterComponents/FooterComponent";
import axios from "axios";

const RoadmapPage = () => {
  const [learningData, setLearningData] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          console.warn("⚠️ Không có suggestion hợp lệ từ backend");
          setLearningData([]);
        }

        if (data.analysis) {
          setAnalysis(data.analysis);
        }

      } catch (err) {
        console.error("❌ Lỗi khi fetch lộ trình:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  const handleDayClick = async (day, skill) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/lessons-by-day?day=${day}&skill=${skill}`);
      if (res.data.length > 0) {
        const lessonId = res.data[0]._id;
        navigate(`/practicelesson/${lessonId}`);
      } else {
        alert(`❌ Không có bài học nào cho Ngày ${day}, kỹ năng ${skill}.`);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy bài học:", err);
      alert("⚠️ Có lỗi xảy ra.");
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
                onClick={() => handleDayClick(item.day, item.skill)}
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
