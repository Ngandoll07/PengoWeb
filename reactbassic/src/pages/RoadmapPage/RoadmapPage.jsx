import React from "react";
import './RoadmapPage.css';
import Footer from "../../components/FooterComponents/FooterComponent";

const learningData = [
  { day: 1, title: 'Luyện nghe đoạn hội thoại + bắt ý chính', status: 'done', progress: 100 },
  { day: 2, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 3, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 4, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 5, title: 'Luyện nghe đoạn hội thoại + bắt ý chính', status: 'done', progress: 100 },
  { day: 6, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 7, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 8, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 9, title: 'Luyện nghe đoạn hội thoại + bắt ý chính', status: 'done', progress: 100 },
  { day: 10, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 11, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
  { day: 12, title: 'Part 5 - focus ngữ pháp', status: 'pending', progress: 0 },
];

const LearningPath = () => {
  return (
    <div className="learning-path">
      <h2>Lộ trình học của bạn</h2>
      <div className="progress-bar">
        <span>%</span>
        <div className="bar">
          <div className="fill" style={{ width: '70%' }}></div>
        </div>
        <span>100%</span>
      </div>
      <div className="summary">
        <p><strong>TOEIC 2 kỹ năng</strong></p>
        <p>Đã hoàn thành: <strong>15/22</strong></p>
        <p>Mục tiêu: <strong>450</strong></p>
      </div>
      <div className="day-list">
        {learningData.map((item, index) => (
          <div className="day-card" key={index}>
            <h3>Day {item.day}</h3>
            <p>{item.title}</p>
            <div className={`status ${item.status}`}>
                <span className="sub-progress">{item.progress}%</span>
            <span className="status-label">
                {item.status === 'done' ? '✅ Hoàn thành' : '⚠️ Chưa hoàn thành'}
            </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningPath;
