import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import DefaultComponent from './components/DefaultComponent/DefaultComponent';
import { CartProvider } from "./context/CartContext"; // ✅ Đảm bảo đường dẫn đúng

function App() {
  return (
    <CartProvider> {/* ✅ Bọc toàn bộ app bên trong CartProvider */}
      <Router>
        <Routes>
          {routes.map((route) => {
            const Page = route.page;
            const Layout = route.isShowHeader ? DefaultComponent : Fragment;

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
