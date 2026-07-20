import React, { useContext, useState } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken, loadCartData } = useContext(StoreContext);
  const [currState, setCurrState] = useState("Login");
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
    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    try {
      const response = await fetch(newUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const resData = await response.json();

      if (resData.success) {
        setToken(resData.token);
        localStorage.setItem("token", resData.token);
        await loadCartData(resData.token);
        setShowLogin(false);
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
        <button type="submit">{currState === "Sign Up" ? "Create account" : "Login"}</button>
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