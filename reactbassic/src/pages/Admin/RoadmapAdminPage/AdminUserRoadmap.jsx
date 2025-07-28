import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import axios from "axios";
import "./AdminUserRoadmap.css";

const AdminUserRoadmap = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/users/${userId}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error("❌ Lỗi lấy user:", err));

    axios.get(`http://localhost:5000/api/roadmap?userId=${userId}`)
      .then((res) => setRoadmaps(res.data))
      .catch((err) => console.error("❌ Lỗi lấy roadmap:", err));
  }, [userId]);

  return (
    <div className="admin-user-roadmap">
      <AdminHeader />

      <div className="roadmap-container">
        <div className="breadcrumb">
          📚 Lộ trình &gt; <span className="current-page">Xem lộ trình</span>
        </div>

        <button className="back-button" onClick={() => navigate(-1)}>⬅️ Quay lại</button>

        <h2 className="user-title">
          Lộ trình của: <span className="user-email">{user?.email || userId}</span>
        </h2>

       <ul className="roadmap-list">
          {roadmaps.map((item) => (
            <li key={item._id} className="roadmap-item">
              <span className="day">🗓️ Ngày {item.day}</span>
              <span className="title">– {item.title}</span>
              <span className={`skill skill-${item.skill.toLowerCase()}`}>– {item.skill}</span>
              <span className={`status status-${item.status.toLowerCase()}`}>- {item.status}</span>
              <span className="progress"> {item.progress}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminUserRoadmap;
