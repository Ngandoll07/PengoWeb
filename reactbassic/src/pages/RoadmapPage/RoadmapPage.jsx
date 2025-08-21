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

      if (Array.isArray(data.suggestion)) {
        setLearningData(data.suggestion);
      } else {
        setLearningData([]);
      }

      setAnalysis(data.analysis || "");

      // ✅ Lưu bài học ngày 1 và level
      if (data.lesson) {
        localStorage.setItem("lesson_day1", JSON.stringify(data.lesson));
        localStorage.setItem("level", data.level);
      }

    } catch (err) {
      console.error("❌ Lỗi khi fetch lộ trình:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchPlan();
}, []);

const handleDayClick = async (item) => {
  console.log("🔍 Bạn đã click vào:", item);
  console.log("➡️ part:", item.part, "level:", item.level, "skill:", item.skill);

  try {
    let questions = [];

    if (item.skill === "listening") {
      // Gọi API Listening
      const res = await axios.get(`http://localhost:5000/api/listening-tests/part/${item.part}`, {
        params: {
          level: item.level,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      questions = res.data;

      if (!questions.length) {
        alert("Không có câu hỏi listening phù hợp.");
        return;
      }

    } else if (item.skill === "reading") {
      // Gọi API Reading
      const res = await axios.get(  `http://localhost:5000/api/reading-tests/part/${item.part}?level=${item.level}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = res.data;

      // Với part 6 hoặc 7 sẽ là blocks, còn lại là questions
      if ((item.part === 6 || item.part === 7) && Array.isArray(data)) {
        questions = data;
      } else if (Array.isArray(data)) {
        questions = data;
      }

      if (!questions.length) {
        alert("Không có câu hỏi reading phù hợp.");
        return;
      }
    } else {
      alert("Kỹ năng không hợp lệ.");
      return;
    }

    const lesson = {
      title: item.title,
      skill: item.skill,
      part: item.part,
      level: item.level,
      questions,
    };

    navigate("/practicelesson/ai", {
      state: {
        lesson,
        day: item.day,
        roadmapItemId: item._id || null,
            status: item.status, // ✅ thêm dòng này
      },
    });
  } catch (err) {
    console.error("❌ Không lấy được câu hỏi:", err);
    alert("Không thể tải bài luyện tập.");
  }
};




  return (
    <div className="learning-container">
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
      <h3>📅 Day {item.day}</h3>
      <p className="title">{item.title}</p>
      <p className="skill">Kỹ năng: <b>{item.skill}</b></p>

    <div className={`status ${item.status}`}>
  <div className="progress-bar">
    <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
  </div>
  <p className="status-label">
    {item.status === "done" ? "✅ Hoàn thành" : "⚠️ Chưa hoàn thành"}
  </p>
</div>

    </div>
  ))}
</div>

       
        </>
      )}
    </div>
       <Footer />
    </div>
  
  );
};

export default RoadmapPage;