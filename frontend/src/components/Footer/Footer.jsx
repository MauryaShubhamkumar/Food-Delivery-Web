import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";
import Logo from "../Logo/Logo";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <Logo />
          <p>
            Delivering your favourite meals hot & fresh right to your doorstep. Experience premium dining at home with fast delivery, top culinary partners, and unmatched convenience.
          </p>
          <div className="footer-social-icons">
            <div className="social-icon-wrapper"><img src={assets.facebook_icon} alt="Facebook" /></div>
            <div className="social-icon-wrapper"><img src={assets.twitter_icon} alt="Twitter" /></div>
            <div className="social-icon-wrapper"><img src={assets.linkedin_icon} alt="LinkedIn" /></div>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Delivery</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>📞 +91-6387252549</li>
            <li>✉️ shubhamkumarmaurya155@gmail.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        © 2024 FoodDel. All rights reserved. Crafted with care for food lovers everywhere.
      </p>
    </div>
    
  );
};

export default Footer;
