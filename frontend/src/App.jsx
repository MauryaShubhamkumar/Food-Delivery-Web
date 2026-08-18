import React, { useContext, lazy, Suspense } from "react";
import { StoreContext } from "./context/StoreContext";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import Profile from "./pages/Profile/Profile";
import ContactUs from "./pages/ContactUs/ContactUs";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import CartConflictModal from "./components/Common/CartConflictModal";
import ImpersonationBanner from "./components/Common/ImpersonationBanner";
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
const AdminInventory = lazy(() => import("./components/Admin/AdminInventory"));
const Onboarding = lazy(() => import("./pages/Onboarding/Onboarding"));
const RestaurantStorefront = lazy(() => import("./pages/RestaurantStorefront/RestaurantStorefront"));

// Super Admin Platform Components
const SuperAdminLayout = lazy(() => import("./components/SuperAdmin/SuperAdminLayout"));
const SuperAdminDashboard = lazy(() => import("./components/SuperAdmin/SuperAdminDashboard"));
const SuperAdminRestaurants = lazy(() => import("./components/SuperAdmin/SuperAdminRestaurants"));
const SuperAdminUsers = lazy(() => import("./components/SuperAdmin/SuperAdminUsers"));
const SuperAdminOrders = lazy(() => import("./components/SuperAdmin/SuperAdminOrders"));
const SuperAdminReviews = lazy(() => import("./components/SuperAdmin/SuperAdminReviews"));
const SuperAdminAnalytics = lazy(() => import("./components/SuperAdmin/SuperAdminAnalytics"));
const SuperAdminRevenueLedger = lazy(() => import("./components/SuperAdmin/SuperAdminRevenueLedger"));

const AdminLoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '12px', color: 'var(--text-muted)' }}>
    <Loader2 size={32} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
    <span>Loading Application...</span>
  </div>
);

const App = () => {
  const { showLogin, setShowLogin } = useContext(StoreContext);
  return (
    <>
      <ImpersonationBanner />
      <Routes>
      {/* Super Admin Platform Routes */}
      <Route
        path="/super-admin/*"
        element={
          <ProtectedAdminRoute requiredPermission="SUPER_ADMIN_ACCESS">
            <Suspense fallback={<AdminLoadingFallback />}>
              <SuperAdminLayout>
                <Routes>
                  <Route path="/" element={<SuperAdminDashboard />} />
                  <Route path="/dashboard" element={<SuperAdminDashboard />} />
                  <Route path="/restaurants" element={<SuperAdminRestaurants />} />
                  <Route path="/revenue-ledger" element={<SuperAdminRevenueLedger />} />
                  <Route path="/users" element={<SuperAdminUsers />} />
                  <Route path="/orders" element={<SuperAdminOrders />} />
                  <Route path="/reviews" element={<SuperAdminReviews />} />
                  <Route path="/analytics" element={<SuperAdminAnalytics />} />
                  <Route path="/onboarding" element={<SuperAdminDashboard />} />
                </Routes>
              </SuperAdminLayout>
            </Suspense>
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/r/:slug/*"
        element={
          <>
            {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : null}
            <CartConflictModal />
            <div className="sticky-navbar-wrapper">
              <Navbar setShowLogin={setShowLogin} />
            </div>
            <div className="app">
              <Suspense fallback={<AdminLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<RestaurantStorefront />} />
                  <Route path="/product/:productId" element={<RestaurantStorefront />} />
                  <Route path="/contact" element={<ContactUs />} />
                </Routes>
              </Suspense>
            </div>
            <Footer />
          </>
        }
      />

      {/* Onboarding Route for Restaurant Owners */}
      <Route
        path="/onboarding"
        element={
          <ProtectedAdminRoute>
            <Suspense fallback={<AdminLoadingFallback />}>
              <Onboarding />
            </Suspense>
          </ProtectedAdminRoute>
        }
      />

      {/* Protected Admin Routes with Suspense Chunking */}
      <Route
        path="/admin/*"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Suspense fallback={<AdminLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<ProtectedAdminRoute requiredPermission="VIEW_DASHBOARD"><AdminDashboard /></ProtectedAdminRoute>} />
                  <Route path="/dashboard" element={<ProtectedAdminRoute requiredPermission="VIEW_DASHBOARD"><AdminDashboard /></ProtectedAdminRoute>} />
                  <Route path="/products" element={<ProtectedAdminRoute requiredPermission="VIEW_PRODUCTS"><AdminProducts /></ProtectedAdminRoute>} />
                  <Route path="/inventory" element={<ProtectedAdminRoute requiredPermission="VIEW_INVENTORY"><AdminInventory /></ProtectedAdminRoute>} />
                  <Route path="/orders" element={<ProtectedAdminRoute requiredPermission="VIEW_ORDERS"><AdminOrders /></ProtectedAdminRoute>} />
                  <Route path="/categories" element={<ProtectedAdminRoute requiredPermission="VIEW_CATEGORIES"><AdminCategories /></ProtectedAdminRoute>} />
                  <Route path="/users" element={<ProtectedAdminRoute requiredPermission="VIEW_CUSTOMERS"><AdminUsers /></ProtectedAdminRoute>} />
                  <Route path="/users/:id" element={<ProtectedAdminRoute requiredPermission="VIEW_CUSTOMERS"><AdminUsers /></ProtectedAdminRoute>} />
                  <Route path="/coupons" element={<ProtectedAdminRoute requiredPermission="VIEW_COUPONS"><AdminCoupons /></ProtectedAdminRoute>} />
                  <Route path="/analytics" element={<ProtectedAdminRoute requiredPermission="VIEW_ANALYTICS"><AdminAnalytics /></ProtectedAdminRoute>} />
                  <Route path="/reviews" element={<ProtectedAdminRoute requiredPermission="VIEW_REVIEWS"><AdminReviews /></ProtectedAdminRoute>} />
                  <Route path="/settings" element={<ProtectedAdminRoute requiredPermission="MANAGE_RESTAURANT_SETTINGS"><AdminSettings /></ProtectedAdminRoute>} />
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
            <CartConflictModal />
            <div className="sticky-navbar-wrapper">
              <Navbar setShowLogin={setShowLogin} />
            </div>
            <div className="app">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order" element={<PlaceOrder />} />
                <Route path="/myorders" element={<MyOrders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/contact" element={<ContactUs />} />
              </Routes>
            </div>
            <Footer />
          </>
        }
      />
    </Routes>
    </>
  );
};

export default App;
