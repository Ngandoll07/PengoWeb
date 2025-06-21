import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoIosSearch } from "react-icons/io";
import { FaUserCircle, FaHome, FaCog, FaSignOutAlt, FaShoppingBasket } from "react-icons/fa";
import { IoPerson, IoLogInOutline } from "react-icons/io5";
import { BiCategoryAlt } from "react-icons/bi";
import { FaTicket, FaRocketchat } from "react-icons/fa6";
import "./Header.css";

const Header = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="sidebar1">
                <div className="admin-logo">
                    <img src="/assets/user/logo.png" alt="logo" className="admin-logo-image" />
                </div>
                <ul>
                    <li className={location.pathname === "/" ? "active" : ""} onClick={() => navigate("/admin")}>
                        <FaHome />
                        <span className="sidebar-text">Dashboard</span>
                    </li>
                    <li className={location.pathname === "/users" ? "active" : ""} onClick={() => navigate("/admin/manage_user")}>
                        <IoPerson />
                        <span className="sidebar-text">Users</span>
                    </li>
                    <li className={location.pathname === "/products" ? "active" : ""} onClick={() => navigate("/admin/manage_product")}>
                        <BiCategoryAlt />
                        <span className="sidebar-text">Kết quả thi</span>
                    </li>
                    <li className={location.pathname === "/orders" ? "active" : ""} onClick={() => navigate("/admin/manage_order")}>
                        <FaShoppingBasket />
                        <span className="sidebar-text">Lộ trình học cá nhân</span>
                    </li>
                    <li className={location.pathname === "/courseadmin" ? "active" : ""} onClick={() => navigate("/admin/courseadmin")}>
                        <FaCog />
                        <span className="sidebar-text">Khoá học</span>
                    </li>
                    <li className={location.pathname === "/orders" ? "active" : ""} onClick={() => navigate("/admin/orders")}>
                        <FaCog />
                        <span className="sidebar-text">Đơn hàng</span>
                    </li>
                    <li className={location.pathname === "/listeningtopic" ? "active" : ""} onClick={() => navigate("/admin/listeningtopic")}>
                        <FaTicket />
                        <span className="sidebar-text">Đề luyện nghe</span>
                    </li>
                    <li className={location.pathname === "/readtopic" ? "active" : ""} onClick={() => navigate("/admin/readtopic")}>
                        <FaTicket />
                        <span className="sidebar-text">Đề luyện đọc</span>
                    </li>
                    <li className={location.pathname === "/coupons" ? "active" : ""} onClick={() => navigate("/admin/manage_coupon")}>
                        <FaTicket />
                        <span className="sidebar-text">Đề luyện viết</span>
                    </li>
                    <li className={location.pathname === "/coupons" ? "active" : ""} onClick={() => navigate("/admin/manage_coupon")}>
                        <FaTicket />
                        <span className="sidebar-text">Đề luyện nói</span>
                    </li>
                    <li className={location.pathname === "/reviews" ? "active" : ""} onClick={() => navigate("/admin/manage_review")}>
                        <FaRocketchat />
                        <span className="sidebar-text">Đề thi TOEIC LR</span>
                    </li>
                    <li className={location.pathname === "/reviews" ? "active" : ""} onClick={() => navigate("/admin/manage_review")}>
                        <FaRocketchat />
                        <span className="sidebar-text">Đề thi TOEIC SW</span>
                    </li>
                    <li className={location.pathname === "/reviews" ? "active" : ""} onClick={() => navigate("/admin/manage_review")}>
                        <FaRocketchat />
                        <span className="sidebar-text">Đề thi TOEIC 4 kỹ năng</span>
                    </li>
                    <li className={location.pathname === "/settings" ? "active" : ""} onClick={() => navigate("/settings")}>
                        <FaCog />
                        <span className="sidebar-text">Bài giảng</span>
                    </li>
                    <li className={location.pathname === "/lesson" ? "active" : ""} onClick={() => navigate("/admin/lesson")}>
                        <FaCog />
                        <span className="sidebar-text">Lộ trình học</span>
                    </li>

                    <li className={location.pathname === "/settings" ? "active" : ""} onClick={() => navigate("/settings")}>

                        <FaCog />
                        <span className="sidebar-text">Điểm trung bình</span>
                    </li> <li className={location.pathname === "/settings" ? "active" : ""} onClick={() => navigate("/settings")}>
                        <FaCog />
                        <span className="sidebar-text">Tài khoản Admin</span>
                    </li>
                    <li onClick={() => console.log("Logging out...")}>
                        <FaSignOutAlt />
                        <span className="sidebar-text">Logout</span>
                    </li>
                </ul>
            </aside>

            {/* Header */}
            <div className="main-content">
                <header className="admin-header">
                    <h2 className="admin-title">Administration</h2>
                    <div className="header-right">
                        <div className="admin-searchBar">
                            <input type="text" placeholder="Search anything..." />
                            <button className="admin-searchButton">
                                <IoIosSearch size={20} className="icon-search-admin" />
                            </button>
                        </div>

                        <div className="admin-avatar">
                            <FaUserCircle size={30} onClick={toggleDropdown} className="avatar-icon" />
                            {dropdownOpen && (
                                <div className="dropdown-menu">
                                    <ul>
                                        <li onClick={() => navigate("/account")}><IoPerson className="icon-dropdown-admin" /> Account</li>
                                        <li onClick={() => console.log("Logging out...")}><IoLogInOutline className="icon-dropdown-admin" /> Log Out</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            </div>
        </div>
    );
};

export default Header;