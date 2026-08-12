import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import {
  Store,
  Star,
  MapPin,
  Clock,
  Truck,
  ShoppingBag,
  ArrowRight,
  Search,
  CheckCircle2,
  Utensils
} from 'lucide-react';
import './ExploreRestaurants.css';

const ExploreRestaurants = ({ title = "Partner Restaurants", subtitle = "Choose your favorite restaurant kitchen to explore their custom menu and place an order" }) => {
  const { url } = useContext(StoreContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${url}/api/restaurant/list`);
        const json = await res.json();
        if (json.success && json.data) {
          setRestaurants(json.data);
        }
      } catch (err) {
        console.error("Failed to load restaurants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [url]);

  const filtered = restaurants.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.city && r.city.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
    );
  });

  const getInitials = (name) => {
    if (!name) return 'R';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const [logoErrors, setLogoErrors] = useState({});

  const handleLogoError = (id) => {
    setLogoErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section className="explore-restaurants-section" id="restaurants">
      <div className="section-header-centered">
        <div className="section-pill-tag">
          <Store size={14} /> LIVE RESTAURANTS
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="restaurants-filter-bar">
        <div className="restaurants-search-box">
          <Search size={18} color="var(--primary-color)" />
          <input
            type="text"
            placeholder="Search restaurants by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>
        <div className="restaurant-count-tag">
          <strong>{filtered.length}</strong> {filtered.length === 1 ? 'Restaurant' : 'Restaurants'} Available
        </div>
      </div>

      {loading ? (
        <div className="restaurants-grid">
          {[1, 2, 3].map(n => (
            <div key={n} className="restaurant-card restaurant-card-skeleton">
              <div className="skeleton-banner" />
              <div className="skeleton-content">
                <div className="skeleton-line title" />
                <div className="skeleton-line desc" />
                <div className="skeleton-line btn" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="no-restaurants-box">
          <Store size={48} color="#94a3b8" />
          <h3>No restaurants found</h3>
          <p>Try searching with a different keyword or location.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {filtered.map((rest) => {
            const isOpen = rest.settings?.is_open !== false;
            return (
              <div
                key={rest.id}
                className="restaurant-card"
                onClick={() => navigate(`/r/${rest.slug}`)}
              >
                <div className="restaurant-card-banner">
                  <div className="banner-bg-pattern" />
                  <div className="restaurant-avatar-wrap">
                    {rest.logo_url && !logoErrors[rest.id] ? (
                      <img
                        src={rest.logo_url}
                        alt={rest.name}
                        className="rest-logo-img"
                        onError={() => handleLogoError(rest.id)}
                      />
                    ) : (
                      <div className="rest-avatar-initials">
                        {getInitials(rest.name)}
                      </div>
                    )}
                  </div>
                  <div className="card-top-badges">
                    <span className={`status-pill ${isOpen ? 'open' : 'closed'}`}>
                      {isOpen ? '● Open' : '● Closed'}
                    </span>
                    <span className="rating-pill">
                      <Star size={13} fill="#ffb703" color="#ffb703" /> {rest.rating || 4.8}
                    </span>
                  </div>
                </div>

                <div className="restaurant-card-body">
                  <div className="rest-title-row">
                    <h3 className="rest-title">{rest.name}</h3>
                    <CheckCircle2 size={16} color="var(--primary-color)" />
                  </div>

                  <div className="rest-meta-row">
                    {rest.address || rest.city ? (
                      <span className="meta-item">
                        <MapPin size={13} /> {rest.city ? `${rest.city}` : rest.address}
                      </span>
                    ) : null}
                    <span className="meta-item">
                      <Utensils size={13} /> {rest.product_count} Dishes
                    </span>
                  </div>

                  <div className="rest-policy-row">
                    <span className="policy-tag">
                      <Truck size={12} /> ₹{Number(rest.settings?.delivery_fee || 40).toFixed(0)} Delivery
                    </span>
                    <span className="policy-tag">
                      <ShoppingBag size={12} /> Min ₹{Number(rest.settings?.minimum_order_amount || 199).toFixed(0)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="visit-storefront-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/r/${rest.slug}`);
                    }}
                  >
                    <span>Explore Menu</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ExploreRestaurants;
