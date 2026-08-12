import React, { useContext, useEffect, useState } from 'react';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import ProductReviewsModal from '../Reviews/ProductReviewsModal';
import ImageWithSkeleton from '../Common/ImageWithSkeleton';
import { Star, ArrowRight, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FoodItem = ({
  id,
  name,
  price,
  description,
  image,
  available = true,
  restaurantName,
  restaurantSlug,
  isHomePage = false
}) => {
  const { url, cartItems, addToCart, removeFromCart } = useContext(StoreContext);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const navigate = useNavigate();

  const isAvailable = available !== false && available !== 0;
  const targetSlug = restaurantSlug || 'skm_restaurant';

  useEffect(() => {
    let isMounted = true;
    if (id) {
      fetch(`${url}/api/reviews/product/${id}?limit=1`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.success && data.summary) {
            setRatingSummary(data.summary);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [id, url]);

  const handleCardClick = () => {
    if (isHomePage) {
      navigate(`/r/${targetSlug}`);
    }
  };

  return (
    <>
      <div
        className={`food-item ${!isAvailable ? 'unavailable-item' : ''} ${isHomePage ? 'homepage-food-card' : ''}`}
        onClick={handleCardClick}
        style={{ cursor: isHomePage ? 'pointer' : 'default' }}
      >
        <div className="food-item-img-container">
          <ImageWithSkeleton
            src={image}
            alt={name}
            className="food-item-image"
            width={500}
          />
          {!isAvailable ? (
            <div className="out-of-stock-badge">
              Out of Stock
            </div>
          ) : isHomePage ? (
            <div className="home-kitchen-pill">
              <Store size={12} /> {restaurantName || 'Partner Kitchen'}
            </div>
          ) : !cartItems[id] ? (
            <img
              className='add'
              onClick={(e) => { e.stopPropagation(); addToCart(id); }}
              src={assets.add_icon_white}
              alt="Add to cart"
            />
          ) : (
            <div className='food-item-counter' onClick={(e) => e.stopPropagation()}>
              <img onClick={() => removeFromCart(id)} src={assets.remove_icon_red} alt="Remove item" />
              <p>{cartItems[id]}</p>
              <img onClick={() => addToCart(id)} src={assets.add_icon_green} alt="Add item" />
            </div>
          )}
        </div>
        <div className="food-item-info">
          <div className="food-item-name-rating">
            <p className="food-item-name-text">{name}</p>
            <div
              className="food-item-rating-badge"
              onClick={(e) => { e.stopPropagation(); setIsReviewsOpen(true); }}
              title="Click to view ratings and reviews"
            >
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span className="rating-num">
                {ratingSummary.averageRating > 0 ? ratingSummary.averageRating.toFixed(1) : 'New'}
              </span>
              {ratingSummary.totalReviews > 0 && (
                <span className="reviews-count">({ratingSummary.totalReviews})</span>
              )}
            </div>
          </div>
          <p className="food-item-desc">
            {description}
          </p>
          <div className="food-item-footer-row">
            <p className="food-item-price">₹{price}</p>
            {!isAvailable ? (
              <span className="unavailable-text-tag">Currently Unavailable</span>
            ) : isHomePage ? (
              <button
                type="button"
                className="btn-order-storefront"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/r/${targetSlug}`);
                }}
              >
                <span>Order from Store</span>
                <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ProductReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        product={{ id, _id: id, name, price, image, description }}
      />
    </>
  )
}

export default FoodItem