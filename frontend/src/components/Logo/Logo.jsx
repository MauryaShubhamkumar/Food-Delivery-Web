import React, { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import './Logo.css';

const Logo = () => {
  const { settings } = useContext(StoreContext);
  const name = settings?.restaurantName || 'FastBite';
  const logoUrl = settings?.logoUrl;

  return (
    <div className="brand-logo">
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="custom-brand-logo-img" />
      ) : (
        <div className="brand-icon-wrapper">
          <svg className="brand-icon-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF5E3A" />
                <stop offset="100%" stopColor="#FF2A6D" />
              </linearGradient>
            </defs>

            {/* Glowing Outer Ring */}
            <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#logoGrad)" />
            
            {/* Chef Cloche & Spark Icons */}
            <path d="M11 25C11 20.0294 15.0294 16 20 16C24.9706 16 29 20.0294 29 25H11Z" fill="white" />
            <rect x="10" y="26" width="20" height="3" rx="1.5" fill="white" opacity="0.9" />
            <circle cx="20" cy="13" r="2" fill="white" />
            
            {/* Steam accent */}
            <path d="M17 9C17 9 18 10 18 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <path d="M23 9C23 9 22 10 22 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>
      )}
      <div className="brand-text-wrapper">
        <span className="brand-name">{name}<span className="brand-dot">.</span></span>
        <span className="brand-tagline">FOOD EXPRESS</span>
      </div>
    </div>
  );
};

export default Logo;
