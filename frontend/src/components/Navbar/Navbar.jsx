import React, { useContext, useEffect, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import Logo from "../Logo/Logo";
import { Moon, Sun, Settings, X, Menu as MenuIcon, Crown, LayoutDashboard, UtensilsCrossed, ArrowLeft } from 'lucide-react';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const {
    getTotalCartAmount,
    cartItems,
    token,
    setToken,
    user,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    storefrontRestaurant,
    setStorefrontRestaurant,
    cartRestaurant
  } = useContext(StoreContext);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll listener for enhanced sticky shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Storefront mode: strictly active when on /r/:slug pages
  const isStorefront = location.pathname.startsWith('/r/');

  // The restaurant to display in navbar — prefer storefrontRestaurant, fall back to cartRestaurant
  const activeRestaurant = storefrontRestaurant || cartRestaurant || null;

  const totalCartCount = Object.values(cartItems || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (window.location.pathname !== '/' && !isStorefront) {
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
    setStorefrontRestaurant(null);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const scrollToSection = (sectionId, menuKey) => {
    setMenu(menuKey);
    setMobileMenuOpen(false);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else if (window.location.pathname !== '/') {
      const targetSlug = activeRestaurant?.slug || storefrontRestaurant?.slug || cartRestaurant?.slug;
      if (isStorefront && targetSlug) {
        navigate(`/r/${targetSlug}#${sectionId}`);
      } else {
        navigate(`/#${sectionId}`);
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return 'R';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const activeLogo = activeRestaurant?.logo_url || activeRestaurant?.logo || activeRestaurant?.logoUrl;

  return (
    <div className={`navbar ${isStorefront ? 'storefront-active-navbar' : ''} ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-left">
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>

        {isStorefront && activeRestaurant ? (
          <div
            className="navbar-storefront-brand"
            onClick={() => scrollToSection("home", "home")}
            title={`${activeRestaurant.name} Storefront`}
          >
            {activeLogo ? (
              <img
                src={activeLogo}
                alt={activeRestaurant.name}
                className="navbar-storefront-logo-img"
              />
            ) : (
              <div className="navbar-storefront-avatar">
                {getInitials(activeRestaurant.name)}
              </div>
            )}
            <div className="navbar-storefront-text">
              <span className="navbar-storefront-name">{activeRestaurant.name}</span>
              <span className="navbar-storefront-badge">
                <span className="live-status-dot"></span> STOREFRONT
              </span>
            </div>
          </div>
        ) : (
          <Link to='/' onClick={() => { setMobileMenuOpen(false); setStorefrontRestaurant(null); }}>
            <Logo />
          </Link>
        )}
      </div>

      <ul className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <span
          onClick={() => scrollToSection("home", "home")}
          className={`nav-link-btn ${menu === "home" ? "active" : ""}`}
        >
          Home
        </span>
        <span
          onClick={() => scrollToSection("explore-menu", "menu")}
          className={`nav-link-btn ${menu === "menu" ? "active" : ""}`}
        >
          Menu
        </span>
        <span
          onClick={() => scrollToSection("contact-us", "contact-us")}
          className={`nav-link-btn ${menu === "contact-us" ? "active" : ""}`}
        >
          {isStorefront ? "Store Info" : "Contact Us"}
        </span>
        {isStorefront && (
          <Link
            to="/"
            onClick={() => { setMobileMenuOpen(false); setStorefrontRestaurant(null); }}
            className="nav-link-btn navbar-all-restaurants-btn"
            title="Explore all restaurants on FastBite"
          >
            <UtensilsCrossed size={14} /> All Restaurants
          </Link>
        )}
      </ul>

      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <div className="navbar-right">
        <div className="theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </div>
        <div className={`navbar-search-box ${showSearchInput || searchQuery ? "active" : ""}`}>
          <img src={assets.search_icon} alt="Search" onClick={handleSearchToggle} className="search-icon" />
          <input
            type="text"
            placeholder={isStorefront && storefrontRestaurant ? `Search ${storefrontRestaurant.name}...` : "Search food items..."}
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery ? (
            <span className="search-clear" onClick={clearSearch}><X size={14} /></span>
          ) : null}
        </div>
        <div className="navbar-search-icon">
          <Link to='/cart' title="View Shopping Cart">
            <img src={assets.basket_icon} alt="Cart" />
          </Link>
          {totalCartCount > 0 ? (
            <span className="navbar-cart-counter">{totalCartCount}</span>
          ) : null}
        </div>
        {!token ? (
          <button onClick={() => setShowLogin(true)} className="navbar-button">Sign In</button>
        ) : (
          <div className="navbar-profile">
            <img src={user?.avatar_url || assets.profile_icon} alt="Profile" className="nav-profile-img" />
            <ul className="nav-profile-dropdown">
              {user?.role === 'super_admin' && (
                <>
                  <li onClick={() => navigate('/super-admin')}>
                    <Crown size={18} style={{ marginRight: '8px', color: '#8b5cf6' }} />
                    <p style={{ fontWeight: 600, color: '#8b5cf6' }}>Super Admin Portal</p>
                  </li>
                  <hr />
                </>
              )}
              {user?.role === 'restaurant_owner' && (
                <>
                  <li onClick={() => navigate('/admin')}>
                    <LayoutDashboard size={18} style={{ marginRight: '8px' }} />
                    <p>Restaurant Dashboard</p>
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
