import React, { useContext } from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";
import Logo from "../Logo/Logo";
import { StoreContext } from "../../context/StoreContext";
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const { settings } = useContext(StoreContext);
  const name = settings?.restaurantName || 'FastBite';
  const desc = settings?.description || 'Delivering your favourite meals hot & fresh right to your doorstep. Experience premium dining at home with fast delivery and unmatched convenience.';
  const phone = settings?.phone || '+91-6387252549';
  const email = settings?.email || 'shubhamkumarmaurya155@gmail.com';
  const address = settings?.address || 'Varanasi, Uttar Pradesh, India';

  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <Logo />
          <p>{desc}</p>
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
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={15} /> {phone}</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={15} /> {email}</li>
            {address ? <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={15} /> {address}</li> : null}
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        © {new Date().getFullYear()} {name}. All rights reserved. Crafted with care for food lovers everywhere.
      </p>
    </div>
  );
};

export default Footer;
