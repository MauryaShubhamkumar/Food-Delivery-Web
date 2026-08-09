import React, { useState, lazy, Suspense } from "react";
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
import { Loader2 } from "lucide-react";

// Lazy-loaded Admin Route Chunks (Isolates Recharts & Admin UI from Customer Bundle)
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./components/Admin/AdminProducts"));
const AdminOrders = lazy(() => import("./components/Admin/AdminOrders"));
const AdminCategories = lazy(() => import("./components/Admin/AdminCategories"));
const AdminUsers = lazy(() => import("./components/Admin/AdminUsers"));
const AdminCoupons = lazy(() => import("./components/Admin/AdminCoupons"));
const AdminSettings = lazy(() => import("./components/Admin/AdminSettings"));
const AdminAnalytics = lazy(() => import("./components/Admin/AdminAnalytics"));
const AdminReviews = lazy(() => import("./components/Admin/AdminReviews"));

const AdminLoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '12px', color: 'var(--text-muted)' }}>
    <Loader2 size={32} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
    <span>Loading Admin Dashboard...</span>
  </div>
);

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <Routes>
      {/* Protected Admin Routes with Suspense Chunking */}
      <Route
        path="/admin/*"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Suspense fallback={<AdminLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/products" element={<AdminProducts />} />
                  <Route path="/orders" element={<AdminOrders />} />
                  <Route path="/categories" element={<AdminCategories />} />
                  <Route path="/users" element={<AdminUsers />} />
                  <Route path="/users/:id" element={<AdminUsers />} />
                  <Route path="/coupons" element={<AdminCoupons />} />
                  <Route path="/analytics" element={<AdminAnalytics />} />
                  <Route path="/reviews" element={<AdminReviews />} />
                  <Route path="/settings" element={<AdminSettings />} />
                </Routes>
              </Suspense>
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
