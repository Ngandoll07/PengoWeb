// src/context/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // ✅ Load giỏ hàng từ localStorage khi tải trang
    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(savedCart);
    }, []);

    // ✅ Lưu giỏ hàng vào localStorage mỗi khi thay đổi
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // ✅ Thêm vào giỏ hàng (nếu đã có thì +1 số lượng)
    const addToCart = (course) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === course.id);
            if (existing) {
                return prev.map(item =>
                    item.id === course.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...course, quantity: 1 }];
        });
    };

    // ✅ Cập nhật số lượng sản phẩm
    const updateQuantity = (id, quantity) => {
        setCart(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, quantity: quantity > 0 ? quantity : 1 }
                    : item
            )
        );
    };

    // ✅ Xoá sản phẩm khỏi giỏ
    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
