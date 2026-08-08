import React, { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import Profile from "./pages/Profile/Profile";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import ProtectedAdminRoute from "./components/Admin/ProtectedAdminRoute";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminProducts from "./components/Admin/AdminProducts";
import AdminOrders from "./components/Admin/AdminOrders";
import AdminCategories from "./components/Admin/AdminCategories";
import AdminUsers from "./components/Admin/AdminUsers";
import AdminCoupons from "./components/Admin/AdminCoupons";
import AdminSettings from "./components/Admin/AdminSettings";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <Routes>
      {/* Protected Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/products" element={<AdminProducts />} />
                <Route path="/orders" element={<AdminOrders />} />
                <Route path="/categories" element={<AdminCategories />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/users/:id" element={<AdminUsers />} />
                <Route path="/coupons" element={<AdminCoupons />} />
                <Route path="/analytics" element={<AdminDashboard />} />
                <Route path="/settings" element={<AdminSettings />} />
              </Routes>
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />

      {/* Main Customer Application Routes */}
      <Route
        path="*"
        element={
          <>
            {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : null}
            <div className="app">
              <Navbar setShowLogin={setShowLogin} />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order" element={<PlaceOrder />} />
                <Route path="/myorders" element={<MyOrders />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
            <Footer />
          </>
        }
      />
    </Routes>
  );
};

export default App;
