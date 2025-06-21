import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // ✅ Load từ localStorage khi mở lại trang
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
        } catch (err) {
            console.error("❌ Lỗi load cart:", err);
            setCart([]);
        }
    }, []);


    // ✅ Lưu vào localStorage khi cart thay đổi
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // ✅ Thêm sản phẩm (nếu có rồi thì cộng số lượng)
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

    // ✅ Cập nhật số lượng
    const updateQuantity = (id, quantity) => {
        setCart(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, quantity: quantity > 0 ? quantity : 1 }
                    : item
            )
        );
    };

    // ✅ Xoá 1 sản phẩm khỏi giỏ
    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // ✅ Xoá toàn bộ giỏ hàng (dùng khi thanh toán xong)
    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
