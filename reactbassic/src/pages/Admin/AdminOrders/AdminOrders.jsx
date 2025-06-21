import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./AdminOrders.css";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/purchase/orders");
            setOrders(res.data);
        } catch (err) {
            console.error("Lỗi khi lấy đơn hàng:", err);
        }
    };

    return (
        <div className="admin-orders-wrapper">
            <AdminHeader />
            <h2 className="admin-orders-title">🧾 Quản lý đơn hàng</h2>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Người mua</th>
                        <th>Email</th>
                        <th>Khoá học</th>
                        <th>Giá</th>
                        <th>Thời gian</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o, idx) => (
                        <tr key={o._id}>
                            <td>{idx + 1}</td>
                            <td>{o.user?.email}</td>
                            <td>{o.user?.email}</td>
                            <td>
                                <ul>
                                    {o.courses.map((c, i) => (
                                        <li key={i}>{c.title}</li>
                                    ))}
                                </ul>
                            </td>
                            <td>
                                {o.courses.reduce((sum, c) => sum + c.price * c.quantity, 0).toLocaleString("vi-VN")} ₫
                            </td>
                            <td>{new Date(o.createdAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminOrders;
