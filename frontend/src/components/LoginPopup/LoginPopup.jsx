import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken, loadCartData, loadUserProfile } = useContext(StoreContext);
  const navigate = useNavigate();
  const [currState, setCurrState] = useState("Login");
  const [accountType, setAccountType] = useState("customer"); // 'customer' | 'restaurant_owner'
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [errorMsg, setErrorMsg] = useState("");

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    let newUrl = url;
    const isSignup = currState === "Sign Up";
    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    const payload = isSignup
      ? { ...data, role: accountType }
      : data;

    try {
      const response = await fetch(newUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData.success) {
        setToken(resData.token);
        localStorage.setItem("token", resData.token);
        await loadCartData(resData.token);
        await loadUserProfile(resData.token);
        setShowLogin(false);

        // Auto-redirect based on role
        if (resData.user?.role === 'super_admin') {
          navigate("/super-admin");
        } else if (resData.user?.role === 'restaurant_owner') {
          if (!resData.user.restaurant_id) {
            navigate("/onboarding");
          } else {
            navigate("/admin");
          }
        }
      } else {
        setErrorMsg(resData.message);
      }
    } catch (err) {
      setErrorMsg("Failed to connect to backend server");
    }
  };

  return (
    <div className='login-popup'>
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
        </div>

        {currState === "Sign Up" && (
          <div className="account-type-selector">
            <span className="type-label">I want to register as:</span>
            <div className="type-pills">
              <button
                type="button"
                className={`type-pill ${accountType === 'customer' ? 'active' : ''}`}
                onClick={() => setAccountType('customer')}
              >
                Foodie (Customer)
              </button>
              <button
                type="button"
                className={`type-pill ${accountType === 'restaurant_owner' ? 'active' : ''}`}
                onClick={() => setAccountType('restaurant_owner')}
              >
                Restaurant Partner
              </button>
            </div>
          </div>
        )}

        {errorMsg ? <div className="login-error">{errorMsg}</div> : null}
        <div className="login-popup-inputs">
          {currState === "Login" ? null : (
            <input
              name='name'
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder='Your name'
              required
            />
          )}
          <input
            name='email'
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder='Your email address'
            required
          />
          <input
            name='password'
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder='Password'
            required
          />
        </div>
        <button type="submit">
          {currState === "Sign Up" ? (accountType === 'restaurant_owner' ? "Create Partner Account" : "Create account") : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" id="agree-terms" required />
          <label htmlFor="agree-terms">By continuing, I agree to the terms of use & privacy policy.</label>
        </div>
        {currState === "Login"
          ? <p className="toggle-state">Create a new account? <span onClick={() => { setCurrState("Sign Up"); setErrorMsg(""); }}>Click here</span></p>
          : <p className="toggle-state">Already have an account? <span onClick={() => { setCurrState("Login"); setErrorMsg(""); }}>Click here</span></p>}
      </form>
    </div>
  );
};

export default LoginPopup;