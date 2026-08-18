import React, { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Zap, Sparkles } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { platformSettings } = useContext(StoreContext);
  const platformName = platformSettings?.platformName || 'FastBite';
  const description = platformSettings?.description || 'Discover top-rated restaurants, browse curated menus, and get delicious food delivered hot & fresh to your doorstep.';

  return (
    <div className="header">
      <div className="header-content">
        <div className="header-badges">
          <span className="header-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={14} /> Fast Multi-Restaurant Delivery
          </span>
          <span className="header-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.2)' }}>
            <Sparkles size={14} /> 100% Fresh & Hygienic
          </span>
        </div>
        <h2>Order your favourite food here</h2>
        <p>{description}</p>
        <a href="#explore-menu" className="header-btn">
          <span>Explore Menu</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default Header;
