import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import {
  ShieldAlert,
  Building2,
  Users,
  Package,
  MessageSquare,
  TrendingUp,
  Clock,
  Moon,
  Sun,
  LogOut,
  Menu,
  Crown,
  LayoutDashboard,
  DollarSign
} from 'lucide-react';
import './SuperAdminLayout.css';

const SuperAdminLayout = ({ children }) => {
  const { user, setToken, setUser, theme, toggleTheme } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    navigate("/");
  };

  const navItems = [
    { name: "Platform Dashboard", path: "/super-admin", icon: <LayoutDashboard size={18} /> },
    { name: "Restaurants", path: "/super-admin/restaurants", icon: <Building2 size={18} /> },
    { name: "Revenue Ledger", path: "/super-admin/revenue-ledger", icon: <DollarSign size={18} /> },
    { name: "Platform Users", path: "/super-admin/users", icon: <Users size={18} /> },
    { name: "Platform Orders", path: "/super-admin/orders", icon: <Package size={18} /> },
    { name: "Platform Reviews", path: "/super-admin/reviews", icon: <MessageSquare size={18} /> },
    { name: "GMV Analytics", path: "/super-admin/analytics", icon: <TrendingUp size={18} /> },
    { name: "Onboarding Tracker", path: "/super-admin/onboarding", icon: <Clock size={18} /> }
  ];

  return (
    <div className="superadmin-container">
      {/* Top Header */}
      <header className="superadmin-header">
        <div className="superadmin-header-left">
          <button
            className="superadmin-sidebar-toggle"
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu size={20} />
          </button>
          <Link to="/super-admin" className="superadmin-brand">
            <span className="platform-badge"><Crown size={12} /> SaaS Admin</span>
            <h2>FastBite Platform Admin</h2>
          </Link>
        </div>

        <div className="superadmin-header-right">
          <div className="superadmin-theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <Link to="/" className="btn-visit-store">
            FastBite Main App
          </Link>
          <div className="superadmin-user-info">
            <div className="superadmin-avatar">
              <Crown size={16} />
            </div>
            <div className="superadmin-details">
              <span className="superadmin-name">{user?.name || 'Super Admin'}</span>
              <span className="superadmin-role-badge">Super Admin</span>
            </div>
            <button className="superadmin-logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="superadmin-body">
        {/* Sidebar */}
        <aside className={`superadmin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
          <nav className="sa-sidebar-nav">
            <div className="sa-section-title">PLATFORM MANAGEMENT</div>
            <ul>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/super-admin' && location.pathname === '/super-admin/');
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`sa-sidebar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      <span className="sa-sidebar-icon">{item.icon}</span>
                      <span className="sa-sidebar-text">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="sa-sidebar-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="superadmin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
