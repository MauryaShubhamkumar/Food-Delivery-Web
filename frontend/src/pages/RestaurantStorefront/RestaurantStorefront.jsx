import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { resolveFoodImage, resolveCategoryImage } from '../../utils/imageHelper';
import ProductReviewsModal from '../../components/Reviews/ProductReviewsModal';
import ImageWithSkeleton from '../../components/Common/ImageWithSkeleton';
import {
  Store,
  Star,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  AlertCircle,
  Clock,
  Truck,
  ArrowLeft,
  X,
  Zap,
  CheckCircle2,
  Navigation,
  QrCode,
  Loader2,
  ChevronRight
} from 'lucide-react';
import './RestaurantStorefront.css';

const RestaurantStorefront = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const {
    url,
    cartItems,
    addToCart,
    removeFromCart,
    cartRestaurant,
    cartConflictModal,
    setCartConflictModal,
    clearCartAndAdd,
    setStorefrontRestaurant,
    searchQuery: globalSearch,
    setSearchQuery: setGlobalSearch
  } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected product for reviews modal
  const [reviewProduct, setReviewProduct] = useState(null);

  // Fetch restaurant details, categories, and products by slug
  const fetchStorefrontData = async () => {
    if (!slug) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Fetch public restaurant profile by slug
      const restRes = await fetch(`${url}/api/restaurant/slug/${slug}`);
      const restData = await restRes.json();

      if (!restData.success) {
        if (restData.restaurant) {
          setIsAvailable(false);
          setRestaurant(restData.restaurant);
        } else {
          setErrorMsg(restData.message || "Restaurant not found.");
          setRestaurant(null);
        }
        setLoading(false);
        return;
      }

      setRestaurant(restData.data);
      setStorefrontRestaurant(restData.data);
      setIsAvailable(true);

      // 2. Fetch restaurant categories & products concurrently
      const [catRes, prodRes] = await Promise.all([
        fetch(`${url}/api/categories?slug=${slug}`),
        fetch(`${url}/api/food/list?slug=${slug}`)
      ]);

      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (catData.success && catData.data) {
        setCategories(catData.data.map(c => ({
          ...c,
          image: resolveCategoryImage(c.name, c.image)
        })));
      }

      if (prodData.success && prodData.data) {
        setProducts(prodData.data.map(p => ({
          ...p,
          _id: String(p._id || p.id),
          id: p.id || p._id,
          image: resolveFoodImage(p.image, p.name)
        })));
      }
    } catch (err) {
      setErrorMsg("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefrontData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Combine local search and global navbar search if active
  const activeSearch = searchQuery || globalSearch || '';

  // Filter products by selected category and active search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !activeSearch.trim() ||
      p.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(activeSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalCartCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const getInitials = (name) => {
    if (!name) return 'R';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="storefront-loading">
        <Loader2 size={44} className="spin-icon" color="#ff5e3a" />
        <p>Loading Restaurant Storefront...</p>
      </div>
    );
  }

  // 404 Restaurant Not Found View
  if (errorMsg || !restaurant) {
    return (
      <div className="storefront-container">
        <div className="storefront-card not-found-card">
          <div className="not-found-icon">
            <Store size={48} />
          </div>
          <h2>Restaurant Not Found</h2>
          <p>{errorMsg || "The restaurant you're looking for doesn't exist or may have moved."}</p>
          <Link to="/" className="btn-primary-store">
            <ArrowLeft size={16} /> Return to FastBite Home
          </Link>
        </div>
      </div>
    );
  }

  // Unavailable / Setup / Inactive View
  if (!isAvailable) {
    return (
      <div className="storefront-container">
        <div className="storefront-card unavailable-card">
          <div className="unavailable-icon">
            <Clock size={48} />
          </div>
          <h2>{restaurant.name} is Currently Unavailable</h2>
          <p>This restaurant is currently setting up or taking a break. Please check back later!</p>
          <Link to="/" className="btn-primary-store">
            <ArrowLeft size={16} /> Explore Active Restaurants
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = restaurant.settings?.is_open !== false && restaurant.settings?.is_open !== 0;
  const hoursText = (restaurant.settings?.opening_time && restaurant.settings?.closing_time)
    ? `${restaurant.settings.opening_time} - ${restaurant.settings.closing_time}`
    : '10:00 AM - 10:00 PM';
  const deliveryFee = restaurant.settings?.delivery_fee !== undefined ? Number(restaurant.settings.delivery_fee) : 40.0;
  const minOrder = restaurant.settings?.minimum_order_amount !== undefined ? Number(restaurant.settings.minimum_order_amount) : 199.0;

  return (
    <div className="storefront-container">
      {/* 1. HERO HEADER SECTION (#home) */}
      <div className="storefront-hero" id="home">
        <div className="hero-content-wrapper">
          <div className="hero-branding">
            <div className="store-logo-wrapper">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt={restaurant.name} className="store-logo-img" />
              ) : (
                <div className="store-logo-fallback">
                  {getInitials(restaurant.name)}
                </div>
              )}
            </div>

            <div className="store-meta-header">
              <div className="store-badges-row">
                <span className="hero-status-badge">
                  <Zap size={14} /> Fast Delivery
                </span>
                <span className={`hero-status-badge ${isOpen ? 'status-open' : 'status-closed'}`}>
                  {isOpen ? `● Open Now (${hoursText})` : '● Closed'}
                </span>
                {restaurant.rating ? (
                  <span className="rating-badge">
                    <Star size={14} className="star-filled" /> {restaurant.rating} ({restaurant.totalReviews} review{restaurant.totalReviews > 1 ? 's' : ''})
                  </span>
                ) : (
                  <span className="rating-badge text-muted">
                    <Star size={14} /> Verified Partner
                  </span>
                )}
              </div>

              <h1 className="store-title">{restaurant.name}</h1>
              <p className="store-tagline">
                Choose from a delectable array of dishes freshly prepared by <strong>{restaurant.name}</strong> and delivered right to your doorstep.
              </p>

              <div className="store-policy-pills">
                <span className="policy-pill">
                  <Truck size={13} /> Delivery Fee: ₹{deliveryFee.toFixed(2)}
                </span>
                <span className="policy-pill">
                  <ShoppingBag size={13} /> Min. Order: ₹{minOrder.toFixed(2)}
                </span>
                {restaurant.address && (
                  <span className="policy-pill">
                    <MapPin size={13} /> {restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ''}
                  </span>
                )}
              </div>

              <div className="hero-actions">
                <a href="#explore-menu" className="btn-explore-menu">
                  Explore Menu <ChevronRight size={18} />
                </a>
                <a href="#contact-us" className="btn-secondary-info">
                  Store Details & Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXPLORE MENU CATEGORIES SECTION (#explore-menu) */}
      <div className="explore-menu-section" id="explore-menu">
        <div className="section-header-centered">
          <h2>Explore Our Menu</h2>
          <p>
            Browse signature categories crafted with fine ingredients. Select a category below to filter our dishes.
          </p>
        </div>

        <div className="explore-menu-scroll-container">
          {categories.map((cat) => {
            const countInCat = products.filter(p => p.category === cat.name).length;
            const isActive = selectedCategory === cat.name;
            return (
              <div
                key={cat.id}
                className={`explore-category-card ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(prev => prev === cat.name ? 'All' : cat.name)}
              >
                <div className="category-img-ring">
                  <img src={cat.image || resolveCategoryImage(cat.name)} alt={cat.name} />
                </div>
                <p className="category-title">{cat.name}</p>
                <span className="category-count">({countInCat})</span>
              </div>
            );
          })}
        </div>
        <hr className="divider-line" />
      </div>

      {/* 3. DISHES & MENU CATALOG SECTION (#food-display) */}
      <div className="food-display-section" id="food-display">
        <div className="food-display-header-row">
          <div className="display-title-box">
            <h2>
              {activeSearch
                ? `Search Results for "${activeSearch}"`
                : selectedCategory === 'All'
                ? `All Dishes from ${restaurant.name}`
                : `${selectedCategory} Dishes`}
            </h2>
            <p className="display-subtitle">
              {filteredProducts.length} delicious item{filteredProducts.length === 1 ? '' : 's'} available
            </p>
          </div>

          <div className="storefront-search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={`Search dishes in ${restaurant.name}...`}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (globalSearch) setGlobalSearch('');
              }}
            />
            {activeSearch && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  setGlobalSearch('');
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="food-no-results">
            <div className="no-results-icon">
              <Search size={40} color="#94a3b8" />
            </div>
            <h3>No matching dishes found</h3>
            <p>
              {activeSearch
                ? `No menu items matching "${activeSearch}" in this category.`
                : "No dishes currently listed under this category."}
            </p>
            {activeSearch && (
              <button
                className="btn-clear-search"
                onClick={() => {
                  setSearchQuery('');
                  setGlobalSearch('');
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="storefront-food-grid">
            {filteredProducts.map(prod => {
              const prodId = String(prod._id || prod.id);
              const qtyInCart = cartItems[prodId] || 0;
              const stockQty = prod.quantity !== undefined ? Number(prod.quantity) : 50;
              const isItemAvailable = prod.available !== false && prod.available !== 0 && stockQty > 0;
              const isLowStock = stockQty > 0 && prod.stockStatus === 'LOW_STOCK';

              return (
                <div key={prodId} className={`storefront-food-card ${!isItemAvailable ? 'item-out-of-stock' : ''}`}>
                  <div className="food-card-image-box">
                    <ImageWithSkeleton
                      src={prod.image}
                      alt={prod.name}
                      className="food-card-img"
                      width={450}
                    />

                    {!isItemAvailable ? (
                      <div className="stock-overlay-badge">Out of Stock</div>
                    ) : isLowStock ? (
                      <div className="low-stock-chip">Only a few left</div>
                    ) : null}

                    {isItemAvailable && (
                      <div className="food-card-cart-btn-wrapper">
                        {!qtyInCart ? (
                          <img
                            className="cart-add-icon"
                            onClick={() => addToCart(prodId, restaurant, prod)}
                            src={assets.add_icon_white}
                            alt="Add to cart"
                            title="Add to cart"
                          />
                        ) : (
                          <div className="food-card-counter">
                            <img
                              onClick={() => removeFromCart(prodId)}
                              src={assets.remove_icon_red}
                              alt="Remove item"
                            />
                            <p>{qtyInCart}</p>
                            <img
                              onClick={() => addToCart(prodId, restaurant, prod)}
                              src={assets.add_icon_green}
                              alt="Add item"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="food-card-body">
                    <div className="food-card-title-row">
                      <h4 className="food-title">{prod.name}</h4>
                      <div
                        className="food-rating-pill"
                        onClick={() => setReviewProduct({ ...prod, id: prodId, _id: prodId })}
                        title="Click to view customer reviews"
                      >
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span>Reviews</span>
                      </div>
                    </div>

                    <p className="food-description">{prod.description}</p>

                    <div className="food-card-footer">
                      <span className="food-price">₹{Number(prod.price).toFixed(2)}</span>
                      {!isItemAvailable && (
                        <span className="tag-unavailable">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. STORE INFORMATION & CONTACT SECTION (#contact-us) */}
      <div className="store-info-section" id="contact-us">
        <div className="store-info-card">
          <div className="store-info-header">
            <div className="store-info-title">
              <Store size={24} color="#ff5e3a" />
              <div>
                <h3>About {restaurant.name}</h3>
                <p>Authentic recipes, hygienic kitchen standards, and prompt delivery.</p>
              </div>
            </div>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="btn-call-store">
                <Phone size={16} /> Call Restaurant
              </a>
            )}
          </div>

          <div className="store-info-grid">
            <div className="info-box">
              <div className="info-icon"><MapPin size={20} /></div>
              <div>
                <h4>Address & Location</h4>
                <p>{restaurant.address || "Contact store for address"}{restaurant.city ? `, ${restaurant.city}` : ''}{restaurant.state ? `, ${restaurant.state}` : ''}{restaurant.pincode ? ` - ${restaurant.pincode}` : ''}</p>
              </div>
            </div>

            <div className="info-box">
              <div className="info-icon"><Clock size={20} /></div>
              <div>
                <h4>Operating Hours</h4>
                <p>{hoursText}</p>
                <span className={`status-badge-inline ${isOpen ? 'open' : 'closed'}`}>
                  {isOpen ? '● Actively Accepting Orders' : '● Temporarily Closed'}
                </span>
              </div>
            </div>

            <div className="info-box">
              <div className="info-icon"><QrCode size={20} /></div>
              <div>
                <h4>Payment Accepted</h4>
                <p>Instant UPI QR (Google Pay, PhonePe, Paytm, BHIM) & Cash on Delivery (COD).</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews Modal */}
      {reviewProduct && (
        <ProductReviewsModal
          isOpen={Boolean(reviewProduct)}
          onClose={() => setReviewProduct(null)}
          product={reviewProduct}
        />
      )}
    </div>
  );
};

export default RestaurantStorefront;
