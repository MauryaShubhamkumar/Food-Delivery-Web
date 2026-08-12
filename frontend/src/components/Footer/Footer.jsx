import React, { useContext } from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";
import Logo from "../Logo/Logo";
import { StoreContext } from "../../context/StoreContext";
import { Link, useLocation } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Utensils,
  ChevronRight,
  ExternalLink
} from "lucide-react";

const Footer = () => {
  const { storefrontRestaurant, settings } = useContext(StoreContext);
  const location = useLocation();

  /* ── Determine mode: strictly storefront routes (/r/:slug) ── */
  const isStorefront = location.pathname.startsWith('/r/') && Boolean(storefrontRestaurant);
  const rest = isStorefront ? storefrontRestaurant : null;

  /* ── Contact data ── */
  const contactPhone = isStorefront
    ? (rest?.settings?.phone || rest?.phone || null)
    : (settings?.phone || "+91-6387252549");

  const contactEmail = isStorefront
    ? (rest?.settings?.email || rest?.email || null)
    : (settings?.email || "shubhamkumarmaurya155@gmail.com");

  const contactAddress = isStorefront
    ? (rest?.settings?.address || rest?.address
        ? [rest?.settings?.address || rest?.address, rest?.city, rest?.state]
            .filter(Boolean)
            .join(", ")
        : null)
    : (settings?.address || "Varanasi, Uttar Pradesh, India");

  const openingTime = isStorefront ? (rest?.settings?.opening_time || "10:00") : (settings?.openingTime || "10:00");
  const closingTime = isStorefront ? (rest?.settings?.closing_time || "22:00") : (settings?.closingTime || "22:00");

  const description = isStorefront
    ? (rest?.settings?.description || `${rest?.name || "This restaurant"} serves fresh, delicious food crafted with love. Order online and get it delivered hot to your doorstep.`)
    : (settings?.description || "Delivering your favourite meals hot & fresh right to your doorstep. Experience premium dining at home with fast delivery and unmatched convenience.");

  const year = new Date().getFullYear();
  const entityName = isStorefront ? rest?.name : "FastBite";

  return (
    <footer className="footer" id="footer">
      {/* Top gradient bar */}
      <div className="footer-top-gradient" />

      <div className="footer-inner">
        {/* ── LEFT COLUMN: Brand ── */}
        <div className="footer-col footer-col-brand">
          {isStorefront ? (
            <div className="footer-restaurant-brand">
              {rest?.logo_url ? (
                <img
                  src={rest.logo_url}
                  alt={rest.name}
                  className="footer-restaurant-logo"
                />
              ) : (
                <div className="footer-restaurant-avatar">
                  {(rest?.name || "R")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div className="footer-restaurant-info">
                <span className="footer-restaurant-name">{rest?.name}</span>
                <span className="footer-restaurant-tagline">
                  {rest?.city || "Delivering happiness"}
                </span>
              </div>
            </div>
          ) : (
            <Link to="/" aria-label="FastBite Home">
              <Logo />
            </Link>
          )}

          <p className="footer-desc">{description}</p>

          {/* Social icons */}
          <div className="footer-socials">
            {[
              { label: "Instagram", href: "#", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
              { label: "Twitter", href: "#", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
              { label: "Facebook", href: "#", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
              { label: "YouTube", href: "#", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
            ].map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                className="footer-social-btn"
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* ── MIDDLE COLUMN: Links ── */}
        <div className="footer-col footer-col-links">
          <h3 className="footer-heading">
            {isStorefront ? "Quick Links" : "Company"}
          </h3>
          <ul className="footer-link-list">
            {isStorefront ? (
              <>
                <li>
                  <a href="#home">
                    <ChevronRight size={14} /> Home
                  </a>
                </li>
                <li>
                  <a href="#explore-menu">
                    <ChevronRight size={14} /> Our Menu
                  </a>
                </li>
                <li>
                  <a href="#contact-us">
                    <ChevronRight size={14} /> Contact &amp; Info
                  </a>
                </li>
                <li>
                  <Link to="/">
                    <ChevronRight size={14} /> All Restaurants
                  </Link>
                </li>
                <li>
                  <Link to="/cart">
                    <ChevronRight size={14} /> View Cart
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/">
                    <ChevronRight size={14} /> Home
                  </Link>
                </li>
                <li>
                  <a href="/#restaurants">
                    <ChevronRight size={14} /> Restaurants
                  </a>
                </li>
                <li>
                  <a href="#explore-menu">
                    <ChevronRight size={14} /> Explore Menu
                  </a>
                </li>
                <li>
                  <a href="#">
                    <ChevronRight size={14} /> About Us
                  </a>
                </li>
                <li>
                  <a href="#">
                    <ChevronRight size={14} /> Privacy Policy
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* ── RIGHT COLUMN: Contact ── */}
        <div className="footer-col footer-col-contact">
          <h3 className="footer-heading">Get In Touch</h3>
          <ul className="footer-contact-list">
            {contactPhone ? (
              <li>
                <a href={`tel:${contactPhone}`} className="footer-contact-item">
                  <span className="footer-contact-icon">
                    <Phone size={15} />
                  </span>
                  <span>{contactPhone}</span>
                </a>
              </li>
            ) : (
              <li>
                <a href="tel:+916387252549" className="footer-contact-item">
                  <span className="footer-contact-icon">
                    <Phone size={15} />
                  </span>
                  <span>+91-6387252549</span>
                </a>
              </li>
            )}

            {contactEmail ? (
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="footer-contact-item"
                >
                  <span className="footer-contact-icon">
                    <Mail size={15} />
                  </span>
                  <span>{contactEmail}</span>
                </a>
              </li>
            ) : (
              <li>
                <a
                  href="mailto:shubhamkumarmaurya155@gmail.com"
                  className="footer-contact-item"
                >
                  <span className="footer-contact-icon">
                    <Mail size={15} />
                  </span>
                  <span>shubhamkumarmaurya155@gmail.com</span>
                </a>
              </li>
            )}

            {contactAddress ? (
              <li>
                <span className="footer-contact-item">
                  <span className="footer-contact-icon">
                    <MapPin size={15} />
                  </span>
                  <span>{contactAddress}</span>
                </span>
              </li>
            ) : (
              <li>
                <span className="footer-contact-item">
                  <span className="footer-contact-icon">
                    <MapPin size={15} />
                  </span>
                  <span>Varanasi, Uttar Pradesh, India</span>
                </span>
              </li>
            )}

            {/* Opening hours (storefront only) */}
            {isStorefront && (
              <li>
                <span className="footer-contact-item">
                  <span className="footer-contact-icon">
                    <Clock size={15} />
                  </span>
                  <span>
                    Open daily &nbsp;
                    <strong style={{ color: "#fff" }}>
                      {openingTime} – {closingTime}
                    </strong>
                  </span>
                </span>
              </li>
            )}
          </ul>

          {/* CTA */}
          {isStorefront ? (
            <a href="#explore-menu" className="footer-cta-btn">
              <Utensils size={15} /> Order Now
              <ArrowRight size={14} />
            </a>
          ) : (
            <Link to="/" className="footer-cta-btn">
              <Utensils size={15} /> Explore Restaurants
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="footer-divider" />

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {year}{" "}
          <strong style={{ color: "#fff" }}>{entityName}</strong>. All rights
          reserved.{" "}
          {isStorefront && (
            <>
              Powered by{" "}
              <Link to="/" className="footer-powered-link">
                FastBite <ExternalLink size={11} style={{ display: "inline" }} />
              </Link>
            </>
          )}
        </p>
        <div className="footer-bottom-links">
          <a href="#">Privacy</a>
          <span className="footer-bottom-dot" />
          <a href="#">Terms</a>
          <span className="footer-bottom-dot" />
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
