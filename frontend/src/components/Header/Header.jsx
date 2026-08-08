import React, { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import './Header.css';

const Header = () => {
  const { settings } = useContext(StoreContext);
  const isOpen = settings?.isOpen && settings?.isActive;
  const restaurantName = settings?.restaurantName || 'FastBite';
  const description = settings?.description || 'Choose from a diverse menu featuring a delectable array of dishes crafted with the finest ingredients and culinary expertise.';
  const hoursText = settings?.openingTime && settings?.closingTime
    ? `${settings.openingTime} - ${settings.closingTime}`
    : '10:00 - 22:00';

  return (
    <div className="header">
      <div className="header-content">
        <div className="header-badges">
          <span className="header-badge">⚡ Fast Delivery</span>
          <span className={`header-badge ${isOpen ? 'status-open' : 'status-closed'}`}>
            {isOpen ? `● Open Now (${hoursText})` : '● Restaurant Closed'}
          </span>
        </div>
        <h2>Welcome to {restaurantName}</h2>
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
