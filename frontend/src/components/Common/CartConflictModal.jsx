import React, { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { AlertTriangle, Trash2, ArrowRight, X } from 'lucide-react';
import './CartConflictModal.css';

const CartConflictModal = () => {
  const {
    cartConflictModal,
    setCartConflictModal,
    cartRestaurant,
    clearCartAndAdd
  } = useContext(StoreContext);

  if (!cartConflictModal) return null;

  const { targetRestaurant, newItemId, itemInfo, foodItemObj } = cartConflictModal;

  const currentRestName = cartRestaurant?.name || 'another restaurant';
  const newRestName = targetRestaurant?.name || 'this restaurant';

  const handleConfirmClear = async () => {
    await clearCartAndAdd(newItemId, targetRestaurant, foodItemObj || itemInfo);
  };

  const handleClose = () => {
    setCartConflictModal(null);
  };

  return (
    <div className="cart-conflict-backdrop" onClick={handleClose}>
      <div className="cart-conflict-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cart-conflict-close-btn" onClick={handleClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="cart-conflict-icon-wrap">
          <AlertTriangle size={32} color="#ff5e3a" />
        </div>

        <h3 className="cart-conflict-title">Replace cart items?</h3>
        <p className="cart-conflict-desc">
          Your cart contains items from <strong>{currentRestName}</strong>. Do you want to clear your cart and start a new order from <strong>{newRestName}</strong>?
        </p>

        <div className="cart-conflict-comparison">
          <div className="conflict-store-pill old-store">
            <span className="pill-label">CURRENT CART</span>
            <span className="pill-name">{currentRestName}</span>
          </div>
          <ArrowRight size={16} className="conflict-arrow-icon" />
          <div className="conflict-store-pill new-store">
            <span className="pill-label">NEW ORDER</span>
            <span className="pill-name">{newRestName}</span>
          </div>
        </div>

        <div className="cart-conflict-actions">
          <button
            type="button"
            className="btn-conflict-cancel"
            onClick={handleClose}
          >
            No, Keep Current Cart
          </button>
          <button
            type="button"
            className="btn-conflict-confirm"
            onClick={handleConfirmClear}
          >
            <Trash2 size={16} />
            <span>Clear Cart & Add Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartConflictModal;
