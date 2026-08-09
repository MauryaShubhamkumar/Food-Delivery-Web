import React, { useContext, useState } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { Lock, AlertTriangle, ShoppingCart, Tag, X, Plus, Minus, Trash2 } from 'lucide-react';
import ImageWithSkeleton from "../../components/Common/ImageWithSkeleton";

const Cart = () => {
  const {
    cartItems,
    food_list,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    getDiscountAmount,
    getFinalCartTotal,
    settings,
    formatCurrency
  } = useContext(StoreContext);
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState({ text: '', isError: false });
  const [applying, setApplying] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoInput || promoInput.trim() === '') {
      setPromoMsg({ text: 'Please enter a promo code', isError: true });
      return;
    }
    setPromoMsg({ text: '', isError: false });
    try {
      setApplying(true);
      const res = await applyCouponCode(promoInput);
      setPromoMsg({ text: res.message, isError: false });
      setPromoInput('');
    } catch (err) {
      setPromoMsg({ text: err.message || 'Invalid promo code', isError: true });
    } finally {
      setApplying(false);
    }
  };

  const handleRemovePromo = () => {
    removeCoupon();
    setPromoMsg({ text: 'Promo code removed', isError: false });
  };

  const subtotal = getTotalCartAmount();
  const discount = getDiscountAmount();
  const deliveryFee = settings?.deliveryFee !== undefined ? Number(settings.deliveryFee) : 40.0;
  const minOrder = settings?.minimumOrderAmount !== undefined ? Number(settings.minimumOrderAmount) : 199.0;
  const isClosed = !settings?.isOpen || !settings?.isActive;
  const isBelowMinOrder = subtotal > 0 && subtotal < minOrder;
  const remainingForMinOrder = (minOrder - subtotal).toFixed(2);

  return (
    <div className="cart">
      <h2 className="cart-header-title">Your Shopping Cart</h2>

      {/* Closed Restaurant Banner */}
      {isClosed ? (
        <div className="cart-warning-banner closed-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} /> <strong>Restaurant Currently Closed:</strong> We are not accepting new orders right now ({settings?.openingTime || '10:00'} - {settings?.closingTime || '22:00'}). You can browse our menu and return during opening hours!
        </div>
      ) : null}

      {/* Below Minimum Order Banner */}
      {isBelowMinOrder && !isClosed ? (
        <div className="cart-warning-banner min-order-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> <strong>Minimum Order Notice:</strong> Minimum order amount is <strong>{formatCurrency(minOrder)}</strong>. Please add <strong>{formatCurrency(remainingForMinOrder)}</strong> more to your cart to proceed to checkout.
        </div>
      ) : null}

      {subtotal === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon"><ShoppingCart size={48} color="#94a3b8" /></div>
          <h3>Your cart is currently empty</h3>
          <p>Explore our delicious menu and add your favorite dishes to get started.</p>
          <button onClick={() => navigate("/")} className="cart-empty-btn">Explore Menu</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            <div className="cart-items-title">
              <p>Items</p>
              <p>Title</p>
              <p>Price</p>
              <p>Quantity</p>
              <p>Total</p>
              <p className="text-center">Action</p>
            </div>
            <hr />
            {food_list.map((item) => {
              const itemId = String(item._id || item.id);
              const qty = cartItems[itemId] || cartItems[item._id] || cartItems[item.id] || 0;
              if (qty > 0) {
                return (
                  <div key={itemId}>
                    <div className="cart-items-title cart-items-item">
                      <div className="cart-img-cell">
                        <ImageWithSkeleton src={item.image} alt={item.name} className="cart-item-img-wrapper" width={120} />
                      </div>
                      <p className="item-name">{item.name}</p>
                      <p className="item-unit-price">{formatCurrency(item.price)}</p>
                      <div className="cart-qty-counter">
                        <button type="button" className="btn-qty-step" onClick={() => removeFromCart(itemId)} title="Decrease quantity">
                          <Minus size={13} />
                        </button>
                        <span className="qty-val-display">{qty}</span>
                        <button type="button" className="btn-qty-step" onClick={() => addToCart(itemId)} title="Increase quantity">
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="item-total">{formatCurrency(qty * item.price)}</p>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            // Remove all quantity of this item
                            for (let i = 0; i < qty; i++) {
                              removeFromCart(itemId);
                            }
                          }}
                          className="btn-remove-cart-item"
                          title="Remove item from cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <hr />
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div className="cart-bottom">
            <div className="cart-total">
              <h2>Cart Summary</h2>
              <div>
                <div className="card-total-details">
                  <p>Subtotal</p>
                  <p>{formatCurrency(subtotal)}</p>
                </div>
                <hr />
                {appliedCoupon ? (
                  <>
                    <div className="card-total-details discount-row">
                      <p>Discount ({appliedCoupon.code})</p>
                      <p className="discount-amount">-{formatCurrency(discount)}</p>
                    </div>
                    <hr />
                  </>
                ) : null}
                <div className="card-total-details">
                  <p>Delivery Fee</p>
                  <p>{formatCurrency(deliveryFee)}</p>
                </div>
                <hr />
                <div className="card-total-details total-highlight">
                  <b>Total</b>
                  <b>{formatCurrency(getFinalCartTotal())}</b>
                </div>
              </div>
              <button
                onClick={() => navigate("/order")}
                disabled={isClosed || isBelowMinOrder}
                className={`checkout-action-btn ${isClosed || isBelowMinOrder ? 'btn-disabled' : ''}`}
              >
                {isClosed ? 'RESTAURANT CLOSED' : isBelowMinOrder ? 'ADD MORE ITEMS TO CHECKOUT' : 'PROCEED TO CHECKOUT'}
              </button>
            </div>
            <div className="cart-promocode">
              <div>
                <p>If you have a promo code, enter it here (e.g. FAST20, WELCOME100, FLAT50)</p>
                {appliedCoupon ? (
                  <div className="applied-coupon-box">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={14} /> Coupon <strong>{appliedCoupon.code}</strong> Applied (-{formatCurrency(discount)})
                    </span>
                    <button className="remove-promo-btn" onClick={handleRemovePromo}>Remove</button>
                  </div>
                ) : (
                  <div className="cart-promocode-input">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    />
                    <button onClick={handleApplyPromo} disabled={applying}>
                      {applying ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                )}
                {promoMsg.text ? (
                  <p className={`promo-feedback ${promoMsg.isError ? 'promo-error' : 'promo-success'}`}>
                    {promoMsg.text}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
