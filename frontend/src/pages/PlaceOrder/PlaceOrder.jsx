import React, { useContext, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { Lock, AlertTriangle, Banknote, QrCode, Copy, Check, Zap, Info } from 'lucide-react';

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    url,
    setcartItems,
    appliedCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalCartTotal,
    settings,
    formatCurrency
  } = useContext(StoreContext);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentReference, setPaymentReference] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const subtotal = getTotalCartAmount();
  const discount = getDiscountAmount();
  const deliveryFee = settings?.deliveryFee !== undefined ? Number(settings.deliveryFee) : 40.0;
  const minOrder = settings?.minimumOrderAmount !== undefined ? Number(settings.minimumOrderAmount) : 199.0;
  const isClosed = !settings?.isOpen || !settings?.isActive;
  const isBelowMinOrder = subtotal > 0 && subtotal < minOrder;

  const upiId = settings?.upiId || "shubhamkumarmaurya155@okaxis";
  const upiQrUrl = settings?.upiQrUrl || null;
  const restaurantName = settings?.restaurantName || "FastBite";
  const finalTotalAmount = getFinalCartTotal();
  const currencyCode = settings?.currency || "INR";

  // Dynamic UPI Deep Link
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${finalTotalAmount.toFixed(2)}&cu=${currencyCode}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const placeOrderSubmit = async (event) => {
    event.preventDefault();

    if (isClosed) {
      alert("The restaurant is currently closed for new orders.");
      return;
    }

    if (isBelowMinOrder) {
      alert(`Minimum order requirement is ${formatCurrency(minOrder)}.`);
      return;
    }

    if (!token) {
      alert("Please login first to place an order!");
      return;
    }

    if (paymentMethod === "upi") {
      if (!paymentReference || paymentReference.trim() === "") {
        alert("Please enter your UTR / Transaction ID after completing your UPI payment.");
        return;
      }
      if (paymentReference.trim().length < 6) {
        alert("Please enter a valid UTR / Transaction ID (at least 6 characters).");
        return;
      }
    }

    let orderItems = [];
    food_list.forEach((item) => {
      const itemId = String(item._id || item.id);
      const qty = cartItems[itemId] || cartItems[item._id] || cartItems[item.id] || 0;
      if (qty > 0) {
        let itemInfo = { ...item, quantity: qty };
        orderItems.push(itemInfo);
      }
    });

    if (orderItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    let orderData = {
      address: data,
      items: orderItems,
      amount: finalTotalAmount,
      couponCode: appliedCoupon?.code || null,
      paymentMethod: paymentMethod,
      paymentReference: paymentMethod === "upi" ? paymentReference.trim() : null
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${url}/api/order/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token
        },
        body: JSON.stringify(orderData)
      });

      const resData = await response.json();

      if (resData.success) {
        setcartItems({});
        removeCoupon();
        if (paymentMethod === "upi") {
          alert("Order placed successfully! Your payment is awaiting admin verification.");
        } else {
          alert("Cash on Delivery order placed successfully!");
        }
        navigate("/myorders");
      } else {
        alert(`Order error: ${resData.message}`);
      }
    } catch (err) {
      alert("Error submitting order to backend server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="place-order" onSubmit={placeOrderSubmit}>
      <div className="place-order-left">
        <h2 className="title">Delivery Information</h2>
        {isClosed ? (
          <div className="cart-warning-banner closed-banner" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} /> <strong>Restaurant Closed:</strong> Orders cannot be placed at this time.
          </div>
        ) : isBelowMinOrder ? (
          <div className="cart-warning-banner min-order-banner" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> <strong>Minimum Order Notice:</strong> Minimum order requirement is <strong>{formatCurrency(minOrder)}</strong>.
          </div>
        ) : null}

        <div className="multi-fields">
          <input name="firstName" onChange={onChangeHandler} value={data.firstName} type="text" placeholder="First Name" required />
          <input name="lastName" onChange={onChangeHandler} value={data.lastName} type="text" placeholder="Last Name" required />
        </div>
        <input name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder="Email address" required />
        <input name="street" onChange={onChangeHandler} value={data.street} type="text" placeholder="Street Address" required />
        <div className="multi-fields">
          <input name="city" onChange={onChangeHandler} value={data.city} type="text" placeholder="City" required />
          <input name="state" onChange={onChangeHandler} value={data.state} type="text" placeholder="State" required />
        </div>
        <div className="multi-fields">
          <input name="zipCode" onChange={onChangeHandler} value={data.zipCode} type="text" placeholder="Zip code" required />
          <input name="country" onChange={onChangeHandler} value={data.country} type="text" placeholder="Country" required />
        </div>
        <input name="phone" onChange={onChangeHandler} value={data.phone} type="text" placeholder="Phone" required />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Order Summary</h2>
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
              <b>{formatCurrency(finalTotalAmount)}</b>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-method-section">
            <h3>Select Payment Method</h3>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span className="payment-option-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Banknote size={16} /> Cash on Delivery
                </span>
              </label>

              <label className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <span className="payment-option-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={16} /> Instant UPI Payment
                </span>
              </label>
            </div>

            {/* UPI Payment Instructions Card */}
            {paymentMethod === 'upi' && (
              <div className="upi-payment-box">
                <div className="upi-header">
                  <h4>Scan QR Code or Pay via UPI</h4>
                  <span className="upi-amount-badge">Amount to Pay: {formatCurrency(finalTotalAmount)}</span>
                </div>

                <div className="upi-qr-wrapper">
                  {upiQrUrl ? (
                    <img src={upiQrUrl} alt="UPI Payment QR Code" className="upi-qr-img" />
                  ) : (
                    <div className="upi-qr-placeholder">
                      <QrCode size={36} color="#64748b" />
                      <p>Scan & Pay via any UPI App</p>
                    </div>
                  )}
                </div>

                <div className="upi-id-box">
                  <span className="upi-label">UPI ID / VPA:</span>
                  <strong className="upi-val">{upiId}</strong>
                  <button type="button" onClick={copyUpiId} className="copy-upi-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {copiedUpi ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy UPI ID</>}
                  </button>
                </div>

                <div className="upi-deeplink-wrapper">
                  <a href={upiDeepLink} className="upi-app-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <Zap size={15} /> Pay using UPI App (GPay, PhonePe, Paytm)
                  </a>
                </div>

                <hr className="upi-divider" />

                <div className="utr-input-group">
                  <label htmlFor="utrInput">
                    Enter UTR / Transaction ID *
                    <span className="utr-subtext">(Obtained from your UPI app receipt after payment)</span>
                  </label>
                  <input
                    type="text"
                    id="utrInput"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. 123456789012 or T2408081234"
                    required={paymentMethod === 'upi'}
                    className="utr-input"
                  />
                  <p className="utr-note" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={14} /> Note: Payment status will be set to <strong>Verification Pending</strong> until verified by the restaurant admin.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="payment-btn"
            disabled={isClosed || isBelowMinOrder || submitting || (paymentMethod === 'upi' && !paymentReference.trim())}
            style={isClosed || isBelowMinOrder || submitting || (paymentMethod === 'upi' && !paymentReference.trim()) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            {submitting
              ? 'PROCESSING ORDER...'
              : isClosed
              ? 'RESTAURANT CLOSED'
              : isBelowMinOrder
              ? 'MIN ORDER NOT MET'
              : paymentMethod === 'upi'
              ? 'SUBMIT UPI ORDER'
              : 'PLACE COD ORDER'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
