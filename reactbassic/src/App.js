import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { routes } from './routes';
import DefaultComponent from './components/DefaultComponent/DefaultComponent';
import { CartProvider } from "./context/CartContext"; // ✅ Đảm bảo đường dẫn đúng

function App() {
    const user = JSON.parse(localStorage.getItem("user")); // 👈 Lấy user từ localStorage
  return (
    <CartProvider> {/* ✅ Bọc toàn bộ app bên trong CartProvider */}
      <Router>
        <Routes>
          {routes.map((route) => {
            const Page = route.page;
            const Layout = route.isShowHeader ? DefaultComponent : Fragment;

            // 👉 Kiểm tra nếu là trang admin nhưng không phải admin
            if (route.path === "/admin" && (!user || user.role !== "admin")) {
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<Navigate to="/" />} // 👉 Redirect nếu không phải admin
                />
              );
            }

            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Layout>
                    <Page />
                  </Layout>
                }
              />
            );
          })}
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
