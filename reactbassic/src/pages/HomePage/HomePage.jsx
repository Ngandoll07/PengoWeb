import React, { useState } from "react";
import { FaMapMarkedAlt, FaBookOpen, FaHeadphones, FaFont } from "react-icons/fa";
import "./HomePage.css";



export default function HomePage() {
  const skills = [
    {
      title: "TOEIC 2 kỹ năng LISTENING & READING",
      button: "LÀM NGAY",
      image: "/assets/homepage/Rectangle 5.png"
    },
    {
      title: "TOEIC 2 kỹ năng SPEAKING & WRITING",
      button: "LÀM NGAY",
      image: "/assets/homepage/Rectangle 7.png"
    },
    {
      title: "TOEIC 4 KỸ NĂNG",
      button: "LÀM NGAY",
      image: "/assets/homepage/Rectangle 9.png"
    }
  ];


  const tools = [
    { image: "/assets/homepage/Route.png", title: "Lộ trình học", href: "#" },
    { image: "/assets/homepage/Test.png", title: "Kho đề thi" , href: "#"},
    { image: "/assets/homepage/Headphones.png", title: "Luyện nghe TOEIC", href: "/practicelistening" },
    { image: "/assets/homepage/Dictionary.png", title: "Luyện từ vựng", href: "#" },
  ];

  const [activeTab, setActiveTab] = useState("lr");

  const tabData = {
    lr: {
      label: "TOEIC LISTENING & READING",
      level: ["TOEIC LR 1 - 295", "TOEIC LR 300 - 595", "TOEIC LR 600+"],
      goal: ["TOEIC LR 300+", "TOEIC LR 600+", "TOEIC LR 800+"],
    },
    sw: {
      label: "TOEIC SPEAKING & WRITING",
      level: ["TOEIC SW Beginner", "TOEIC SW Intermediate", "TOEIC SW Advanced"],
      goal: ["TOEIC SW 110+", "TOEIC SW 140+", "TOEIC SW 160+"],
    },
    full: {
      label: "TOEIC 4 KỸ NĂNG",
      level: ["Beginner", "Intermediate", "Advanced"],
      goal: ["TOEIC 4 Skills 400+", "TOEIC 4 Skills 700+", "TOEIC 4 Skills 900+"],
    },
  };

  const { level, goal } = tabData[activeTab];

  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);


  return (
    <div>
      <section className="home-slider">
        <div className="home-slider-left">
          <h1>Rèn luyện mỗi ngày</h1>
          <h2>Đạt ngay mục tiêu!</h2>
          <button className="start-btn">BẮT ĐẦU</button>
        </div>
      </section>



      <div className="homepage-container">
        <div className="skill-section">
          {skills.map((item, index) => (
            <div key={index} className="skill-card">
              <img src={item.image} alt={item.title} className="skill-image" />
              <h3>{item.title}</h3>
              <button>{item.button}</button>
            </div>
          ))}
        </div>
        <h2 className="homepage-title">Đồng hành cùng bạn trên hành trình chinh phục TOEIC!</h2>
        <div className="tool-section">
          {tools.map((tool, index) => (
            <div key={index} className="tool-item">
              <a href= {tool.href}><img src={tool.image} alt={tool.title} className="tool-image" /></a>
              <h3>{tool.title}</h3>
            </div>
          ))}
        </div>

        <div className="path-section">
          <div className="path-header">
            <h2>Lộ trình học dành riêng cho bạn</h2>
            <img src="/assets/homepage/Bot assistant.png" className="path-image" alt="assistant bot" />
          </div>

          {/* Tabs */}
          <div className="path-tabs">
            <div
              className={`tab ${activeTab === "lr" ? "active" : ""}`}
              onClick={() => setActiveTab("lr")}
            >
              TOEIC LISTENING & READING
            </div>
            <div
              className={`tab ${activeTab === "sw" ? "active" : ""}`}
              onClick={() => setActiveTab("sw")}
            >
              TOEIC SPEAKING & WRITING
            </div>
            <div
              className={`tab ${activeTab === "full" ? "active" : ""}`}
              onClick={() => setActiveTab("full")}
            >
              TOEIC 4 KỸ NĂNG
            </div>
          </div>

          {/* Grid */}
          <div className="path-info">
            <div className="path-grid">
              <div className="path-box">
                <h4>TRÌNH ĐỘ CỦA TÔI</h4>
                {level.map((item, idx) => (
                  <p
                    key={idx}
                    className={selectedLevel === item ? "selected" : ""}
                    onClick={() => setSelectedLevel(item)}
                  >
                    {item}
                  </p>
                ))}
              </div>

              <div className="path-box">
                <h4>MỤC TIÊU CỦA TÔI</h4>
                {goal.map((item, idx) => (
                  <p
                    key={idx}
                    className={selectedGoal === item ? "selected" : ""}
                    onClick={() => setSelectedGoal(item)}
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="test-area">
              <span>Bạn chưa rõ trình độ bản thân?</span>
              <button className="test-button">LÀM BÀI THI THỬ</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );

}

