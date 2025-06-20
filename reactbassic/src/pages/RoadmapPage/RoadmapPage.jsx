import React, { useEffect, useState } from "react";
import './RoadmapPage.css';
import Footer from "../../components/FooterComponents/FooterComponent";

const RoadmapPage = () => {
  const [learningData, setLearningData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/recommend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            listeningScore: 22, // Hoặc lấy từ điểm thực tế của người dùng
            readingScore: 18,
          }),
        });

        const data = await res.json();
        console.log("🤖 AI trả về:", data.suggestion);

        if (!data.suggestion || !Array.isArray(data.suggestion)) {
          console.error("❌ Dữ liệu AI không hợp lệ hoặc không phải mảng!");
          return;
        }

        setLearningData(data.suggestion);
      } catch (err) {
        console.error("❌ Lỗi khi fetch lộ trình:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  return (
    <div className="learning-path">
      <h2>Lộ trình học của bạn</h2>

      {loading ? (
        <p>Đang tải lộ trình từ AI...</p>
      ) : (
        <>
          <div className="day-list">
            {learningData.map((item, index) => (
              <div className="day-card" key={index}>
                <h3>Day {item.day}</h3>
                <p>{item.title}</p>
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
