import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import { MdModeEdit } from "react-icons/md";
import "./User.css";
import axios from "axios";

const AdminUser = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);

    // Load danh sách user từ backend
    useEffect(() => {
    axios.get("http://localhost:5000/api/users")
        .then(res => setUsers(res.data))
        .catch(err => console.error("Lỗi lấy users:", err));
}, []);


    const handleEdit = (userId) => {
        navigate(`/admin/edit_user/${userId}`);
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
                            <th>Controls</th>
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
                                    <button className="edit-btn" onClick={() => handleEdit(user._id)}>
                                        <MdModeEdit />
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
