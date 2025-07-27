import React, { useEffect, useState } from "react";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import axios from "axios";
import "./User.css";

const AdminUser = () => {
  const [users, setUsers] = useState([]);

  // Fetch users from backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Lỗi lấy users:", err));
  }, []);

  const handleLock = async (userId, lockStatus) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${userId}/lock`,
        { isLocked: lockStatus }
      );
      setUsers(users.map((u) => (u._id === userId ? res.data : u)));
    } catch (err) {
      console.error("Error locking user:", err);
    }
  };

 

  return (
    <div className="user-admin-wrapper">
      <AdminHeader />
      <h2 className="manage-user-title">Manage Users</h2>
      <div className="user-card">
        <table className="user-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Controls</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    className={`role-tag ${
                      user.role === "admin" ? "admin-role" : "user-role"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleString()}</td>
                <td>
                  <span
                    className={`status-tag ${
                      user.isLocked ? "locked" : "active"
                    }`}
                  >
                    {user.isLocked ? "Locked" : "Active"}
                  </span>
                </td>
                <td>
                  <button
                    className={`lock-btn ${
                      user.isLocked ? "unlock-btn" : "lock-btn"
                    }`}
                    onClick={() => handleLock(user._id, !user.isLocked)}
                  >
                    {user.isLocked ? "Unlock" : "Lock"}
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

export default AdminUser;
