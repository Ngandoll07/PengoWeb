// AdminUserList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import axios from "axios";
import "../AdminUser/User.css";
import { MdVisibility } from "react-icons/md";

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Lỗi khi lấy danh sách user", err));
  }, []);

  const handleViewRoadmap = (userId) => {
    navigate(`/admin/roadmaps/${userId}`);
  };

  return (
    <div className="user-admin-wrapper">
      <AdminHeader />
      <h2 className="manage-user-title">Danh sách người học</h2>
      <div className="user-card">
        <table className="user-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ngày tạo</th>
              <th>Xem lộ trình</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{new Date(user.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => handleViewRoadmap(user._id)}
                  >
                    <MdVisibility />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserList;
