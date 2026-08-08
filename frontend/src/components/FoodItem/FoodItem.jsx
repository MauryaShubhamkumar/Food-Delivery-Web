import React, { useContext } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const getOptimizedImgSrc = (src) => {
  if (!src) return src;
  if (src.includes('res.cloudinary.com') && !src.includes('/f_auto,q_auto')) {
    return src.replace('/upload/', '/upload/f_auto,q_auto,w_500/');
  }
  return src;
};

const FoodItem = ({ id, name, price, description, image, available = true }) => {
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);

  const isAvailable = available !== false && available !== 0;

  return (
    <div className={`food-item ${!isAvailable ? 'unavailable-item' : ''}`}>
      <div className="food-item-img-container">
        <img className='food-item-image' src={getOptimizedImgSrc(image)} alt={name} loading="lazy" />
        {!isAvailable ? (
          <div className="out-of-stock-badge">
            Out of Stock
          </div>
        ) : !cartItems[id] ? (
          <img className='add' onClick={() => addToCart(id)} src={assets.add_icon_white} alt="Add" />
        ) : (
          <div className='food-item-counter'>
            <img onClick={() => removeFromCart(id)} src={assets.remove_icon_red} alt="Remove" />
            <p>{cartItems[id]}</p>
            <img onClick={() => addToCart(id)} src={assets.add_icon_green} alt="Add" />
          </div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_starts} alt="Rating" />
        </div>
        <p className="food-item-desc">
          {description}
        </p>
        <div className="food-item-footer-row">
          <p className="food-item-price">₹{price}</p>
          {!isAvailable && <span className="unavailable-text-tag">Currently Unavailable</span>}
        </div>
      </div>
    </div>
  )
}

export default FoodItem