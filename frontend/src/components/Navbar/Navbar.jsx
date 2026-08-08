import React, { useContext, useEffect, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import Logo from "../Logo/Logo";
import { Moon, Sun, Settings, X } from 'lucide-react';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken, user, searchQuery, setSearchQuery, theme, toggleTheme } = useContext(StoreContext);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // If not on home page, navigate to home page so food list is visible
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleSearchToggle = () => {
    setShowSearchInput(prev => !prev);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };

  return (
    <div className="navbar">
      <Link to='/'><Logo /></Link>
      <ul className="navbar-menu">
        <Link to='/'
          onClick={() => setMenu("home")}
          className={menu === "home" ? "active" : ""}
        >
          Home
        </Link>
        <a href="#explore-menu"
          onClick={() => setMenu("menu")}
          className={menu === "menu" ? "active" : ""}
        >
          Menu
        </a>
        <a href="#app-download"
          onClick={() => setMenu("mobile-app")}
          className={menu === "mobile-app" ? "active" : ""}
        >
          Mobile App
        </a>
        <a href="#footer"
          onClick={() => setMenu("contact-us")}
          className={menu === "contact-us" ? "active" : ""}
        >
          Contact Us
        </a>
      </ul>
      <div className="navbar-right">
        <div className="theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </div>
        <div className={`navbar-search-box ${showSearchInput || searchQuery ? "active" : ""}`}>
          <img src={assets.search_icon} alt="Search" onClick={handleSearchToggle} className="search-icon" />
          <input
            type="text"
            placeholder="Search food items..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery ? (
            <span className="search-clear" onClick={clearSearch}><X size={14} /></span>
          ) : null}
        </div>
        <div className="navbar-search-icon">
          <Link to='/cart'> <img src={assets.basket_icon} alt="Cart" /></Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? (
          <button onClick={() => setShowLogin(true)} className="navbar-button">Sign In</button>
        ) : (
          <div className="navbar-profile">
            <img src={user?.avatar_url || assets.profile_icon} alt="Profile" className="nav-profile-img" />
            <ul className="nav-profile-dropdown">
              {user?.role === 'admin' && (
                <>
                  <li onClick={() => navigate('/admin')}>
                    <Settings size={18} style={{ marginRight: '8px' }} />
                    <p>Admin Dashboard</p>
                  </li>
                  <hr />
                </>
              )}
              <li onClick={() => navigate('/profile')}>
                <img src={user?.avatar_url || assets.profile_icon} alt="Profile" />
                <p>My Profile</p>
              </li>
              <hr />
              <li onClick={() => navigate('/myorders')}>
                <img src={assets.bag_icon} alt="Orders" />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="Logout" />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
