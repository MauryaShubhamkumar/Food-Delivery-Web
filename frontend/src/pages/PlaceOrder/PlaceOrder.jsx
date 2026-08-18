import React, { useContext, useState, useEffect, useRef } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  AlertTriangle,
  Banknote,
  QrCode,
  Copy,
  Check,
  Zap,
  Info,
  CheckCircle2,
  MapPin,
  ShoppingBag,
  LogIn,
  ArrowLeft,
  Loader2,
  Sparkles
} from 'lucide-react';
import {
  validateField,
  validateAddressForm,
  fetchPincodeDetails,
  normalizePhone,
  PINCODE_REGEX
} from "../../utils/addressValidation";

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
    formatCurrency,
    cartRestaurant,
    user,
    userLoading,
    setShowLogin
  } = useContext(StoreContext);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentReference, setPaymentReference] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Field-level error & touched tracking
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState("");

  const inputRefs = {
    firstName: useRef(null),
    lastName: useRef(null),
    email: useRef(null),
    street: useRef(null),
    city: useRef(null),
    state: useRef(null),
    zipCode: useRef(null),
    phone: useRef(null),
    paymentReference: useRef(null)
  };

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phone: ""
  });

  const totalCartCount = Object.values(cartItems || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);

  // Auto-fetch profile & prefill delivery information when user is signed in
  useEffect(() => {
    const prefillDeliveryInfo = async () => {
      let currentUser = user;
      if (!currentUser && token) {
        try {
          const res = await fetch(`${url}/api/user/me`, {
            headers: { token }
          });
          const resData = await res.json();
          if (resData.success && resData.user) {
            currentUser = resData.user;
          }
        } catch (e) {
          console.error("Error prefilling checkout from profile:", e);
        }
      }

      if (currentUser) {
        const fName = currentUser.firstName || currentUser.first_name || (currentUser.name ? currentUser.name.trim().split(' ')[0] : '');
        const lName = currentUser.lastName || currentUser.last_name || (currentUser.name ? currentUser.name.trim().split(' ').slice(1).join(' ') : '');

        const prefilledData = {
          firstName: fName || '',
          lastName: lName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          street: currentUser.street || '',
          city: currentUser.city || '',
          state: currentUser.state || '',
          zipCode: currentUser.zipCode || currentUser.zip_code || '',
          country: currentUser.country || 'India'
        };

        setData(prefilledData);

        if (currentUser.street || currentUser.city || currentUser.phone) {
          setIsPrefilled(true);
        }
      }
    };

    if (token) {
      prefillDeliveryInfo();
    }
  }, [token, user, url]);

  // Real-time Field Validation & PIN auto-lookup
  const onChangeHandler = async (event) => {
    const { name, value } = event.target;
    setData(prev => ({ ...prev, [name]: value }));

    // Real-time validation if field was touched
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }

    // Auto-PIN Code Lookup when 6 digits are typed
    if (name === "zipCode") {
      const cleanPin = value.trim();
      if (cleanPin.length === 6 && PINCODE_REGEX.test(cleanPin)) {
        setPincodeLoading(true);
        setPincodeSuccessMsg("");
        try {
          const result = await fetchPincodeDetails(cleanPin);
          if (result.success) {
            setData(prev => ({
              ...prev,
              city: result.city || prev.city,
              state: result.state || prev.state
            }));
            setPincodeSuccessMsg(`Auto-detected: ${result.city}, ${result.state}`);
            // Clear errors for auto-filled fields
            setErrors(prev => ({
              ...prev,
              zipCode: null,
              city: null,
              state: null
            }));
          } else {
            setPincodeSuccessMsg("");
          }
        } catch (e) {
          setPincodeSuccessMsg("");
        } finally {
          setPincodeLoading(false);
        }
      } else {
        setPincodeSuccessMsg("");
      }
    }
  };

  const onBlurHandler = (event) => {
    const { name, value } = event.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const subtotal = getTotalCartAmount();
  const discount = getDiscountAmount();
  const activeSettings = cartRestaurant?.settings || settings;
  const deliveryFee = activeSettings?.delivery_fee !== undefined ? Number(activeSettings.delivery_fee) : (activeSettings?.deliveryFee !== undefined ? Number(activeSettings.deliveryFee) : 40.0);
  const minOrder = activeSettings?.minimum_order_amount !== undefined ? Number(activeSettings.minimum_order_amount) : (activeSettings?.minimumOrderAmount !== undefined ? Number(activeSettings.minimumOrderAmount) : 199.0);
  const isClosed = activeSettings?.is_open === false || activeSettings?.isOpen === false || activeSettings?.is_active === false || activeSettings?.isActive === false;
  const isBelowMinOrder = subtotal > 0 && subtotal < minOrder;

  const upiId = activeSettings?.upi_id || activeSettings?.upiId || "shubhamkumarmaurya155@okaxis";
  const upiQrUrl = activeSettings?.upi_qr_url || activeSettings?.upiQrUrl || null;
  const restaurantName = cartRestaurant?.name || activeSettings?.restaurant_name || activeSettings?.restaurantName || "FastBite";
  const finalTotalAmount = getFinalCartTotal();
  const currencyCode = activeSettings?.currency || "INR";

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
      setShowLogin(true);
      return;
    }

    // 1. Strict Form Validation
    const validation = validateAddressForm(data);
    const allTouched = {
      firstName: true,
      lastName: true,
      email: true,
      street: true,
      city: true,
      state: true,
      zipCode: true,
      phone: true
    };
    setTouched(allTouched);
    setErrors(validation.errors);

    if (!validation.isValid) {
      const firstInvalidField = Object.keys(validation.errors)[0];
      if (firstInvalidField && inputRefs[firstInvalidField]?.current) {
        inputRefs[firstInvalidField].current.focus();
      }
      return;
    }

    // 2. UPI Reference Validation
    if (paymentMethod === "upi") {
      const ref = (paymentReference || '').trim();
      if (!ref || ref.length < 6) {
        setErrors(prev => ({ ...prev, paymentReference: "Please enter a valid UTR / Transaction ID (at least 6 alphanumeric characters)." }));
        if (inputRefs.paymentReference?.current) {
          inputRefs.paymentReference.current.focus();
        }
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
      address: {
        ...data,
        phone: normalizePhone(data.phone)
      },
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
        if (resData.errors && typeof resData.errors === 'object') {
          setErrors(prev => ({ ...prev, ...resData.errors }));
        }
        alert(resData.message || "Failed to place order. Please review your delivery details.");
      }
    } catch (err) {
      alert("Error submitting order to backend server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading State: Prevent UI flash while checking authentication
  if (userLoading && token) {
    return (
      <div className="checkout-loading-page">
        <div className="spinner"></div>
        <p>Verifying authentication & loading checkout...</p>
      </div>
    );
  }

  // 2. Unauthenticated State: Show clean in-page sign-in prompt (Form & Payment hidden)
  if (!token) {
    return (
      <div className="checkout-auth-required-page">
        <div className="checkout-auth-card">
          <div className="checkout-auth-icon-wrap">
            <Lock size={36} />
          </div>
          <h2>Sign In to Complete Your Order</h2>
          <p className="checkout-auth-subtitle">
            Please sign in or create an account to enter your delivery address and finalize your order.
          </p>

          {totalCartCount > 0 && (
            <div className="checkout-cart-summary-badge">
              <ShoppingBag size={18} color="#ff5e3a" />
              <div className="cart-badge-text">
                <strong>{totalCartCount} item{totalCartCount === 1 ? '' : 's'} saved in your cart</strong>
                <span>Subtotal: {formatCurrency(subtotal)} • {restaurantName}</span>
              </div>
            </div>
          )}

          <div className="checkout-auth-actions">
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="checkout-auth-signin-btn"
            >
              <LogIn size={16} /> Sign In to Proceed
            </button>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="checkout-auth-back-btn"
            >
              <ArrowLeft size={16} /> Return to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty Cart State
  if (totalCartCount === 0) {
    return (
      <div className="checkout-empty-cart-page">
        <div className="checkout-auth-card">
          <div className="checkout-auth-icon-wrap">
            <ShoppingBag size={36} />
          </div>
          <h2>Your Cart is Empty</h2>
          <p className="checkout-auth-subtitle">
            Add some delicious food items from the menu before proceeding to checkout.
          </p>
          <div className="checkout-auth-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="checkout-auth-signin-btn"
            >
              Explore Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated Checkout Flow
  return (
    <form className="place-order" onSubmit={placeOrderSubmit} noValidate>
      <div className="place-order-left">
        <h2 className="title">Delivery Information</h2>
        {isPrefilled && (
          <div className="prefill-status-badge">
            <CheckCircle2 size={15} color="#10b981" />
            <span>Prefilled with your saved default delivery address from profile.</span>
          </div>
        )}

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
          <div className="input-field-wrapper">
            <input
              ref={inputRefs.firstName}
              name="firstName"
              onChange={onChangeHandler}
              onBlur={onBlurHandler}
              value={data.firstName}
              type="text"
              placeholder="First Name *"
              required
              className={touched.firstName && errors.firstName ? "input-error" : ""}
            />
            {touched.firstName && errors.firstName && (
              <span className="field-error-msg">{errors.firstName}</span>
            )}
          </div>

          <div className="input-field-wrapper">
            <input
              ref={inputRefs.lastName}
              name="lastName"
              onChange={onChangeHandler}
              onBlur={onBlurHandler}
              value={data.lastName}
              type="text"
              placeholder="Last Name *"
              required
              className={touched.lastName && errors.lastName ? "input-error" : ""}
            />
            {touched.lastName && errors.lastName && (
              <span className="field-error-msg">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="input-field-wrapper">
          <input
            ref={inputRefs.email}
            name="email"
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            value={data.email}
            type="email"
            placeholder="Email address *"
            required
            className={touched.email && errors.email ? "input-error" : ""}
          />
          {touched.email && errors.email && (
            <span className="field-error-msg">{errors.email}</span>
          )}
        </div>

        <div className="input-field-wrapper">
          <input
            ref={inputRefs.street}
            name="street"
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            value={data.street}
            type="text"
            placeholder="Street Address (Flat / House No, Street) *"
            required
            className={touched.street && errors.street ? "input-error" : ""}
          />
          {touched.street && errors.street && (
            <span className="field-error-msg">{errors.street}</span>
          )}
        </div>

        <div className="multi-fields">
          <div className="input-field-wrapper">
            <input
              ref={inputRefs.zipCode}
              name="zipCode"
              onChange={onChangeHandler}
              onBlur={onBlurHandler}
              value={data.zipCode}
              type="text"
              maxLength={6}
              placeholder="6-Digit PIN Code *"
              required
              className={touched.zipCode && errors.zipCode ? "input-error" : ""}
            />
            {pincodeLoading && (
              <span className="pincode-status-tag loading">
                <Loader2 size={12} className="spin-icon" /> Detecting City & State...
              </span>
            )}
            {pincodeSuccessMsg && !pincodeLoading && (
              <span className="pincode-status-tag success">
                <Sparkles size={12} /> {pincodeSuccessMsg}
              </span>
            )}
            {touched.zipCode && errors.zipCode && (
              <span className="field-error-msg">{errors.zipCode}</span>
            )}
          </div>

          <div className="input-field-wrapper">
            <input
              ref={inputRefs.city}
              name="city"
              onChange={onChangeHandler}
              onBlur={onBlurHandler}
              value={data.city}
              type="text"
              placeholder="City *"
              required
              className={touched.city && errors.city ? "input-error" : ""}
            />
            {touched.city && errors.city && (
              <span className="field-error-msg">{errors.city}</span>
            )}
          </div>
        </div>

        <div className="multi-fields">
          <div className="input-field-wrapper">
            <input
              ref={inputRefs.state}
              name="state"
              onChange={onChangeHandler}
              onBlur={onBlurHandler}
              value={data.state}
              type="text"
              placeholder="State *"
              required
              className={touched.state && errors.state ? "input-error" : ""}
            />
            {touched.state && errors.state && (
              <span className="field-error-msg">{errors.state}</span>
            )}
          </div>

          <div className="input-field-wrapper">
            <input
              name="country"
              onChange={onChangeHandler}
              value={data.country}
              type="text"
              placeholder="Country"
              readOnly
              className="country-readonly-input"
            />
          </div>
        </div>

        <div className="input-field-wrapper">
          <input
            ref={inputRefs.phone}
            name="phone"
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            value={data.phone}
            type="tel"
            maxLength={15}
            placeholder="10-Digit Mobile Number (e.g. 9876543210) *"
            required
            className={touched.phone && errors.phone ? "input-error" : ""}
          />
          {touched.phone && errors.phone && (
            <span className="field-error-msg">{errors.phone}</span>
          )}
        </div>
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
                    ref={inputRefs.paymentReference}
                    type="text"
                    id="utrInput"
                    value={paymentReference}
                    onChange={(e) => {
                      setPaymentReference(e.target.value);
                      if (errors.paymentReference) {
                        setErrors(prev => ({ ...prev, paymentReference: null }));
                      }
                    }}
                    placeholder="e.g. 123456789012 or T2408081234"
                    required={paymentMethod === 'upi'}
                    className={`utr-input ${errors.paymentReference ? "input-error" : ""}`}
                  />
                  {errors.paymentReference && (
                    <span className="field-error-msg">{errors.paymentReference}</span>
                  )}
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
