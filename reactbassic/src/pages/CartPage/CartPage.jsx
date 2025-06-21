import React from "react";
import "./CartPage.css";
import { useCart } from "../../context/CartContext";

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity } = useCart();

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="cart-container">
            <h2>🛒 Giỏ hàng của bạn</h2>

            <table className="cart-table">
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th>Số lượng</th>
                        <th>Tạm tính</th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map((item) => (
                        <tr key={item.id}>
                            <td className="product-info">
                                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>×</button>
                                <img src={item.image} alt={item.title} />
                                <span>{item.title}</span>
                            </td>
                            <td>{item.price.toLocaleString("vi-VN")} ₫</td>
                            <td>
                                <div className="quantity-control">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                </div>
                            </td>
                            <td>{(item.price * item.quantity).toLocaleString("vi-VN")} ₫</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="cart-actions">
                <div className="discount">
                    <input type="text" placeholder="Nhập mã giảm giá" />
                    <button>Áp dụng</button>
                </div>

                <div className="total">
                    <h3>Tổng cộng giỏ hàng</h3>
                    <div className="total-row">
                        <span>Tạm tính</span>
                        <span>{total.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="total-row">
                        <strong>Tổng</strong>
                        <strong>{total.toLocaleString("vi-VN")} ₫</strong>
                    </div>
                    <button className="checkout-btn">Tiến hành thanh toán</button>
                </div>
            </div>
        </div>
    );
}
