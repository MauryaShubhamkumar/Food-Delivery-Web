import React, { useContext, useEffect, useState } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import ProductReviewsModal from '../Reviews/ProductReviewsModal'
import ImageWithSkeleton from '../Common/ImageWithSkeleton'
import { Star } from 'lucide-react'

const FoodItem = ({ id, name, price, description, image, available = true }) => {
  const { url, cartItems, addToCart, removeFromCart } = useContext(StoreContext);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const isAvailable = available !== false && available !== 0;

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

  return (
    <>
      <div className={`food-item ${!isAvailable ? 'unavailable-item' : ''}`}>
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
          ) : !cartItems[id] ? (
            <img className='add' onClick={() => addToCart(id)} src={assets.add_icon_white} alt="Add to cart" />
          ) : (
            <div className='food-item-counter'>
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
              onClick={() => setIsReviewsOpen(true)}
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
            {!isAvailable && <span className="unavailable-text-tag">Currently Unavailable</span>}
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