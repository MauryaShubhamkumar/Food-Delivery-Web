import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Users,
  FolderTree,
  Tag,
  TrendingUp,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  Store,
  LogOut,
  Menu
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user, setToken, setUser, theme, toggleTheme, settings } = useContext(StoreContext);
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
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} />, functional: true },
    { name: "Products", path: "/admin/products", icon: <UtensilsCrossed size={18} />, functional: true },
    { name: "Orders", path: "/admin/orders", icon: <Package size={18} />, functional: true },
    { name: "Users", path: "/admin/users", icon: <Users size={18} />, functional: true },
    { name: "Categories", path: "/admin/categories", icon: <FolderTree size={18} />, functional: true },
    { name: "Coupons", path: "/admin/coupons", icon: <Tag size={18} />, functional: true },
    { name: "Analytics", path: "/admin/analytics", icon: <TrendingUp size={18} />, functional: true },
    { name: "Reviews", path: "/admin/reviews", icon: <MessageSquare size={18} />, functional: true },
    { name: "Settings", path: "/admin/settings", icon: <Settings size={18} />, functional: true }
  ];

  return (
    <div className="admin-container">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button 
            className="admin-sidebar-toggle" 
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu size={20} />
          </button>
          <Link to="/admin" className="admin-brand">
            <span className="brand-badge">Admin</span>
            <h2>{settings?.restaurantName || 'FastBite'} Admin</h2>
          </Link>
        </div>

        <div className="admin-header-right">
          <div className="admin-theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <Link to="/" className="back-to-store-btn">
            <Store size={16} /> Back to Store
          </Link>
          <div className="admin-user-info">
            <div className="admin-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-details">
              <span className="admin-name">{user?.name || 'Administrator'}</span>
              <span className="admin-role-badge">Super Admin</span>
            </div>
            <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            <div className="sidebar-section-title">MAIN MENU</div>
            <ul>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');
                return (
                  <li key={item.name}>
                    {item.functional ? (
                      <Link 
                        to={item.path} 
                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => setMobileSidebarOpen(false)}
                      >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-text">{item.name}</span>
                      </Link>
                    ) : (
                      <div 
                        className="sidebar-link disabled"
                        title="Feature coming soon"
                      >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-text">{item.name}</span>
                        <span className="placeholder-pill">Soon</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
