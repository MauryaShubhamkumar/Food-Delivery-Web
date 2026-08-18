import React, { useContext, useEffect, useState } from 'react';
import './ContactUs.css';
import { StoreContext } from '../../context/StoreContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  UtensilsCrossed,
  Truck,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Building2,
  Headphones,
  ArrowRight,
  CheckCircle2,
  Users,
  Compass
} from 'lucide-react';

const ContactUs = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    url,
    platformSettings,
    storefrontRestaurant,
    formatCurrency
  } = useContext(StoreContext);

  const isStorefront = Boolean(slug || location.pathname.startsWith('/r/'));
  const [loading, setLoading] = useState(isStorefront);
  const [restaurantData, setRestaurantData] = useState(null);

  // Fetch restaurant public details only when in storefront mode
  useEffect(() => {
    if (!isStorefront) {
      setLoading(false);
      return;
    }

    const fetchRestaurantDetails = async () => {
      setLoading(true);
      try {
        const queryParam = slug ? `slug=${encodeURIComponent(slug)}` : '';
        const response = await fetch(`${url}/api/settings${queryParam ? `?${queryParam}` : ''}`);
        const data = await response.json();

        if (data.success && data.data) {
          setRestaurantData(data.data);
        } else if (storefrontRestaurant) {
          setRestaurantData({
            restaurantName: storefrontRestaurant.name,
            logoUrl: storefrontRestaurant.logo_url,
            phone: storefrontRestaurant.phone || '',
            email: storefrontRestaurant.email || '',
            address: storefrontRestaurant.address || '',
            city: storefrontRestaurant.city || '',
            state: storefrontRestaurant.state || '',
            description: storefrontRestaurant.description || '',
            openingTime: '10:00',
            closingTime: '22:00',
            isOpen: true,
            deliveryFee: 40,
            minimumOrderAmount: 199
          });
        }
      } catch (err) {
        console.error("Failed to fetch restaurant contact details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [slug, url, isStorefront, storefrontRestaurant]);

  if (loading) {
    return (
      <div className="contact-loading-container">
        <div className="spinner"></div>
        <p>Loading contact information...</p>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     1. RESTAURANT-SPECIFIC CONTACT US (STOREFRONT MODE: /r/:slug/contact)
     ───────────────────────────────────────────────────────────── */
  if (isStorefront) {
    const rName = restaurantData?.restaurantName || storefrontRestaurant?.name || 'Restaurant';
    const rLogo = restaurantData?.logoUrl || storefrontRestaurant?.logo_url || null;
    const rDesc = restaurantData?.description || 'Authentic flavors, fast home delivery, and delicious dining experiences.';
    const rPhone = restaurantData?.phone || '';
    const rEmail = restaurantData?.email || '';
    const rAddress = restaurantData?.address || '';
    const rCity = restaurantData?.city || '';
    const rState = restaurantData?.state || '';
    const rPincode = restaurantData?.pincode || '';
    const rOpenTime = restaurantData?.openingTime || '10:00';
    const rCloseTime = restaurantData?.closingTime || '22:00';
    const rIsOpen = restaurantData?.isOpen !== false;
    const rDeliveryFee = restaurantData?.deliveryFee !== undefined ? restaurantData.deliveryFee : 40;
    const rMinOrder = restaurantData?.minimumOrderAmount !== undefined ? restaurantData.minimumOrderAmount : 199;

    const fullAddress = [rAddress, rCity, rState, rPincode].filter(Boolean).join(', ');
    const cleanPhoneDigits = rPhone ? rPhone.replace(/\D/g, '') : '';
    const menuLink = slug ? `/r/${slug}` : '/';

    return (
      <div className="contact-page-container">
        {/* Restaurant Hero Banner */}
        <div className="contact-hero-card">
          <div className="contact-hero-content">
            <div className="contact-restaurant-avatar">
              {rLogo ? (
                <img src={rLogo} alt={rName} className="contact-logo-img" />
              ) : (
                <div className="contact-logo-fallback">
                  <Store size={32} color="#ff5e3a" />
                </div>
              )}
            </div>

            <div className="contact-hero-text">
              <div className="contact-name-row">
                <h1>{rName}</h1>
                <span className={`contact-status-badge ${rIsOpen ? 'open' : 'closed'}`}>
                  <span className="status-dot"></span>
                  {rIsOpen ? `Open Now (${rOpenTime} - ${rCloseTime})` : 'Currently Closed'}
                </span>
              </div>
              <p className="contact-hero-desc">{rDesc}</p>
              {fullAddress && (
                <p className="contact-hero-location">
                  <MapPin size={14} /> {fullAddress}
                </p>
              )}
            </div>
          </div>

          <div className="contact-hero-actions">
            <button onClick={() => navigate(menuLink)} className="explore-store-btn">
              <UtensilsCrossed size={16} /> Explore Menu & Order
            </button>
          </div>
        </div>

        {/* Restaurant Direct Contact Channels */}
        <div className="contact-channels-grid">
          {/* Phone Channel */}
          <div className="contact-channel-card">
            <div className="channel-icon-wrap phone-icon">
              <Phone size={22} />
            </div>
            <div className="channel-info">
              <h3>Call Us Directly</h3>
              <p className="channel-value">{rPhone || 'Available upon request'}</p>
              <span className="channel-subtext">Direct line to restaurant staff</span>
            </div>
            {rPhone && (
              <a href={`tel:${cleanPhoneDigits}`} className="channel-action-btn phone-btn">
                <Phone size={14} /> Call Restaurant
              </a>
            )}
          </div>

          {/* WhatsApp Channel */}
          <div className="contact-channel-card">
            <div className="channel-icon-wrap whatsapp-icon">
              <MessageSquare size={22} />
            </div>
            <div className="channel-info">
              <h3>WhatsApp Chat</h3>
              <p className="channel-value">Chat with Store Team</p>
              <span className="channel-subtext">Instant messaging on WhatsApp</span>
            </div>
            {rPhone && (
              <a
                href={`https://wa.me/${cleanPhoneDigits.length === 10 ? `91${cleanPhoneDigits}` : cleanPhoneDigits}?text=${encodeURIComponent(`Hi ${rName}, I would like to inquire about your menu & orders.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="channel-action-btn whatsapp-btn"
              >
                <MessageSquare size={14} /> Chat on WhatsApp
              </a>
            )}
          </div>

          {/* Email Channel */}
          <div className="contact-channel-card">
            <div className="channel-icon-wrap email-icon">
              <Mail size={22} />
            </div>
            <div className="channel-info">
              <h3>Email Support</h3>
              <p className="channel-value">{rEmail || 'Email not listed'}</p>
              <span className="channel-subtext">Feedback, catering & inquiries</span>
            </div>
            {rEmail && (
              <a href={`mailto:${rEmail}?subject=${encodeURIComponent(`Inquiry for ${rName}`)}`} className="channel-action-btn email-btn">
                <Mail size={14} /> Send Email
              </a>
            )}
          </div>

          {/* Store Location */}
          <div className="contact-channel-card">
            <div className="channel-icon-wrap location-icon">
              <MapPin size={22} />
            </div>
            <div className="channel-info">
              <h3>Store Location</h3>
              <p className="channel-value">{rCity ? `${rCity}, ${rState}` : 'Store Location'}</p>
              <span className="channel-subtext">{rAddress || 'Find us on Google Maps'}</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${rName} ${fullAddress}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="channel-action-btn map-btn"
            >
              <ExternalLink size={14} /> Get Directions
            </a>
          </div>
        </div>

        {/* Restaurant Details: Operating Hours & Services */}
        <div className="contact-details-grid">
          {/* Operating Hours */}
          <div className="services-panel-card">
            <div className="panel-card-header">
              <Clock size={18} color="#ff5e3a" />
              <h3>Operating Hours & Timing</h3>
            </div>
            <div className="hours-table">
              <div className="hours-row highlight">
                <span>Monday – Sunday</span>
                <strong>{rOpenTime} – {rCloseTime}</strong>
              </div>
              <div className="hours-row">
                <span>Live Order Acceptance</span>
                <span className="text-success">Available daily during open hours</span>
              </div>
              <div className="hours-row">
                <span>Kitchen Status</span>
                <span className={rIsOpen ? "text-success" : "text-closed"}>
                  {rIsOpen ? "● Kitchen Active & Cooking" : "● Kitchen Currently Closed"}
                </span>
              </div>
            </div>
          </div>

          {/* Available Services */}
          <div className="services-panel-card">
            <div className="panel-card-header">
              <Sparkles size={18} color="#ff5e3a" />
              <h3>Available Dining & Delivery Services</h3>
            </div>
            <div className="fulfillment-badges-list">
              <div className="fulfillment-item">
                <div className="fulfillment-icon"><Truck size={18} /></div>
                <div className="fulfillment-text">
                  <strong>Doorstep Food Delivery</strong>
                  <span>Min order {formatCurrency(rMinOrder)} • Delivery fee {formatCurrency(rDeliveryFee)}</span>
                </div>
              </div>

              <div className="fulfillment-item">
                <div className="fulfillment-icon"><ShoppingBag size={18} /></div>
                <div className="fulfillment-text">
                  <strong>Takeaway / Self Pickup</strong>
                  <span>Order online and collect freshly prepared dishes</span>
                </div>
              </div>

              <div className="fulfillment-item">
                <div className="fulfillment-icon"><UtensilsCrossed size={18} /></div>
                <div className="fulfillment-text">
                  <strong>Dine-In Seating</strong>
                  <span>Warm ambience & prompt table service</span>
                </div>
              </div>

              <div className="fulfillment-item">
                <div className="fulfillment-icon"><ShieldCheck size={18} /></div>
                <div className="fulfillment-text">
                  <strong>Contactless & UPI Payments</strong>
                  <span>Instant QR Code, Online & Cash on Delivery accepted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. PLATFORM-LEVEL CONTACT US (MARKETPLACE MODE: /contact)
     Controlled strictly by Super Admin / FastBite Platform
     ───────────────────────────────────────────────────────────── */
  const pName = platformSettings?.platformName || 'FastBite';
  const pEmail = platformSettings?.supportEmail || 'support@fastbite.in';
  const pPhone = platformSettings?.supportPhone || '+91 6387252549';
  const pAddress = platformSettings?.supportAddress || 'FastBite HQ, Tech Hub, Varanasi, Uttar Pradesh, India';
  const pDesc = platformSettings?.description || 'FastBite is your premier multi-restaurant food delivery marketplace connecting you with top-rated restaurants.';
  const cleanPlatformPhone = pPhone.replace(/\D/g, '');

  return (
    <div className="contact-page-container platform-contact-page">
      {/* Platform Hero Banner */}
      <div className="platform-hero-card">
        <div className="platform-hero-content">
          <div className="platform-brand-badge">
            <Logo />
          </div>

          <div className="platform-hero-text">
            <div className="platform-title-row">
              <h1>{pName} Platform Support</h1>
              <span className="platform-support-badge">
                <Headphones size={13} /> 24/7 Helpline Active
              </span>
            </div>
            <p className="platform-hero-desc">{pDesc}</p>
            <p className="platform-hero-hq">
              <Building2 size={14} /> Corporate HQ: {pAddress}
            </p>
          </div>
        </div>

        <div className="platform-hero-actions">
          <button onClick={() => navigate('/#restaurants')} className="explore-store-btn">
            <Compass size={16} /> Explore All Restaurants
          </button>
        </div>
      </div>

      {/* Platform Direct Support Channels */}
      <div className="contact-channels-grid">
        {/* 24/7 Platform Helpline */}
        <div className="contact-channel-card">
          <div className="channel-icon-wrap phone-icon">
            <Headphones size={22} />
          </div>
          <div className="channel-info">
            <h3>24/7 Platform Helpline</h3>
            <p className="channel-value">{pPhone}</p>
            <span className="channel-subtext">Order queries, payment & delivery support</span>
          </div>
          <a href={`tel:${cleanPlatformPhone}`} className="channel-action-btn phone-btn">
            <Phone size={14} /> Call Platform Support
          </a>
        </div>

        {/* WhatsApp Platform Desk */}
        <div className="contact-channel-card">
          <div className="channel-icon-wrap whatsapp-icon">
            <MessageSquare size={22} />
          </div>
          <div className="channel-info">
            <h3>WhatsApp Support Desk</h3>
            <p className="channel-value">Chat with FastBite Support</p>
            <span className="channel-subtext">Fast live chat assistance</span>
          </div>
          <a
            href={`https://wa.me/${cleanPlatformPhone.length === 10 ? `91${cleanPlatformPhone}` : cleanPlatformPhone}?text=${encodeURIComponent(`Hi FastBite Support, I need assistance with my marketplace order.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="channel-action-btn whatsapp-btn"
          >
            <MessageSquare size={14} /> Chat on WhatsApp
          </a>
        </div>

        {/* Official Support Email */}
        <div className="contact-channel-card">
          <div className="channel-icon-wrap email-icon">
            <Mail size={22} />
          </div>
          <div className="channel-info">
            <h3>Support & Inquiries</h3>
            <p className="channel-value">{pEmail}</p>
            <span className="channel-subtext">Customer service, escalations & feedback</span>
          </div>
          <a href={`mailto:${pEmail}?subject=${encodeURIComponent(`FastBite Platform Support Inquiry`)}`} className="channel-action-btn email-btn">
            <Mail size={14} /> Email Support
          </a>
        </div>

        {/* Corporate Headquarters */}
        <div className="contact-channel-card">
          <div className="channel-icon-wrap location-icon">
            <Building2 size={22} />
          </div>
          <div className="channel-info">
            <h3>Headquarters Location</h3>
            <p className="channel-value">Varanasi, Uttar Pradesh</p>
            <span className="channel-subtext">FastBite Operations Center</span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pName} ${pAddress}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="channel-action-btn map-btn"
          >
            <ExternalLink size={14} /> View Location
          </a>
        </div>
      </div>

      {/* Platform Info: Ecosystem & Partner Onboarding */}
      <div className="contact-details-grid">
        {/* Left Column: Platform Trust & Safety */}
        <div className="services-panel-card">
          <div className="panel-card-header">
            <ShieldCheck size={18} color="#ff5e3a" />
            <h3>Platform Trust & Customer Guarantee</h3>
          </div>
          <div className="fulfillment-badges-list">
            <div className="fulfillment-item">
              <div className="fulfillment-icon"><CheckCircle2 size={18} /></div>
              <div className="fulfillment-text">
                <strong>100% Verified Restaurants</strong>
                <span>Every restaurant is vetted for food hygiene and culinary standards.</span>
              </div>
            </div>

            <div className="fulfillment-item">
              <div className="fulfillment-icon"><Truck size={18} /></div>
              <div className="fulfillment-text">
                <strong>Rapid Doorstep Delivery</strong>
                <span>Real-time delivery tracking and swift courier dispatch across all partner outlets.</span>
              </div>
            </div>

            <div className="fulfillment-item">
              <div className="fulfillment-icon"><ShieldCheck size={18} /></div>
              <div className="fulfillment-text">
                <strong>Secure Payments & Instant Resolution</strong>
                <span>Full customer protection with instant UPI payment confirmation and quick refunds.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Restaurant Partner Onboarding Card */}
        <div className="services-panel-card partner-onboarding-panel">
          <div className="panel-card-header">
            <Store size={18} color="#ff5e3a" />
            <h3>Are you a Restaurant Owner?</h3>
          </div>
          <div className="partner-card-body">
            <p className="partner-intro-text">
              Join {pName}'s rapidly growing multi-restaurant marketplace. Reach thousands of local food lovers with zero setup fees, online ordering, and real-time dashboard management.
            </p>
            <ul className="partner-perks-list">
              <li><CheckCircle2 size={14} color="#10b981" /> Custom shareable storefront link (fastbite.in/r/your-restaurant)</li>
              <li><CheckCircle2 size={14} color="#10b981" /> Instant QR Code generator & marketing flyers</li>
              <li><CheckCircle2 size={14} color="#10b981" /> Direct customer payments with 0% gateway markup</li>
            </ul>
            <button
              onClick={() => navigate('/onboarding')}
              className="partner-register-btn"
            >
              <Store size={16} /> Register Your Restaurant Now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
