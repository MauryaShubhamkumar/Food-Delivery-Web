import { createContext, useEffect, useState } from "react";
import { food_list as defaultFoodList } from "../assets/assets";
import { resolveFoodImage, resolveCategoryImage } from "../utils/imageHelper";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setcartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cartItems") || "{}");
    } catch (e) {
      return {};
    }
  });
  const [foodList, setFoodList] = useState(defaultFoodList);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const loadUserProfile = async (authToken) => {
    if (!authToken) {
      setUser(null);
      setUserLoading(false);
      return;
    }
    setUserLoading(true);
    try {
      const response = await fetch(`${url}/api/user/me`, {
        method: "GET",
        headers: { token: authToken }
      });
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  const [cartRestaurant, setCartRestaurantState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cartRestaurant") || "null");
    } catch (e) {
      return null;
    }
  });
  const [cartConflictModal, setCartConflictModal] = useState(null);

  const [storefrontRestaurant, setStorefrontRestaurantState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('storefrontRestaurant') || 'null');
    } catch (e) {
      return null;
    }
  });

  const setStorefrontRestaurant = (data) => {
    setStorefrontRestaurantState(data);
    if (data) {
      localStorage.setItem('storefrontRestaurant', JSON.stringify(data));
    } else {
      localStorage.removeItem('storefrontRestaurant');
    }
  };

  const [cartItemsDetails, setCartItemsDetails] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cartItemsDetails") || "{}");
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const setCartRestaurant = (rest) => {
    setCartRestaurantState(rest);
    if (rest) {
      localStorage.setItem("cartRestaurant", JSON.stringify(rest));
    } else {
      localStorage.removeItem("cartRestaurant");
    }
  };

  const clearCart = () => {
    setcartItems({});
    setCartItemsDetails({});
    localStorage.removeItem("cartItems");
    localStorage.removeItem("cartItemsDetails");
    setCartRestaurant(null);
    setAppliedCoupon(null);
    setCartConflictModal(null);
  };

  const clearCartAndAdd = async (itemId, targetRestaurantInfo, foodItemObj) => {
    clearCart();
    setCartRestaurant(targetRestaurantInfo);
    setcartItems({ [itemId]: 1 });

    if (foodItemObj) {
      const resolvedImg = resolveFoodImage(foodItemObj.image, foodItemObj.name);
      const normalizedItem = {
        ...foodItemObj,
        _id: String(foodItemObj._id || foodItemObj.id),
        id: foodItemObj.id || foodItemObj._id,
        image: resolvedImg,
        price: Number(foodItemObj.price)
      };
      setCartItemsDetails({ [String(itemId)]: normalizedItem });
      localStorage.setItem("cartItemsDetails", JSON.stringify({ [String(itemId)]: normalizedItem }));
      setFoodList(prev => {
        const exists = prev.some(p => String(p._id || p.id) === String(itemId));
        return exists ? prev : [...prev, normalizedItem];
      });
    }

    if (token) {
      try {
        await fetch(`${url}/api/cart/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ itemId })
        });
      } catch (err) {
        console.error("Cart sync error:", err);
      }
    }
  };

  const addToCart = async (itemId, targetRestaurantInfo = null, foodItemObj = null) => {
    // Determine item info
    let itemInfo = foodItemObj || foodList.find((product) => String(product._id || product.id) === String(itemId)) || cartItemsDetails[itemId];
    if (itemInfo && (itemInfo.available === false || itemInfo.available === 0)) {
      alert(`"${itemInfo.name}" is currently out of stock and unavailable.`);
      return false;
    }

    const totalCartCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

    // Single-restaurant boundary check
    if (
      totalCartCount > 0 &&
      cartRestaurant &&
      targetRestaurantInfo &&
      Number(cartRestaurant.id) !== Number(targetRestaurantInfo.id)
    ) {
      setCartConflictModal({
        targetRestaurant: targetRestaurantInfo,
        newItemId: itemId,
        itemInfo,
        foodItemObj
      });
      return false;
    }

    if (targetRestaurantInfo && totalCartCount === 0) {
      setCartRestaurant(targetRestaurantInfo);
    }

    if (foodItemObj) {
      const resolvedImg = resolveFoodImage(foodItemObj.image, foodItemObj.name);
      const normalizedItem = {
        ...foodItemObj,
        _id: String(foodItemObj._id || foodItemObj.id),
        id: foodItemObj.id || foodItemObj._id,
        image: resolvedImg,
        price: Number(foodItemObj.price)
      };
      setCartItemsDetails(prev => {
        const updated = { ...prev, [String(itemId)]: normalizedItem };
        localStorage.setItem("cartItemsDetails", JSON.stringify(updated));
        return updated;
      });
      setFoodList(prev => {
        const exists = prev.some(p => String(p._id || p.id) === String(itemId));
        return exists ? prev : [...prev, normalizedItem];
      });
    }

    if (!cartItems[itemId]) {
      setcartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setcartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }

    if (token) {
      try {
        await fetch(`${url}/api/cart/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token
          },
          body: JSON.stringify({ itemId })
        });
      } catch (err) {
        console.error("Cart sync error:", err);
      }
    }
    return true;
  };

  const removeFromCart = async (itemId) => {
    setcartItems((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) - 1) }));

    if (token) {
      try {
        await fetch(`${url}/api/cart/remove`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token
          },
          body: JSON.stringify({ itemId })
        });
      } catch (err) {
        console.error("Cart sync error:", err);
      }
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = foodList.find((product) => String(product._id || product.id) === String(item)) || cartItemsDetails[item];
        if (itemInfo) {
          totalAmount += Number(itemInfo.price || 0) * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const fetchFoodList = async () => {
    try {
      const response = await fetch(`${url}/api/food/list`);
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        // Map MySQL id to _id and resolve image source
        const mappedData = data.data.map(item => {
          return {
            ...item,
            _id: String(item.id),
            image: resolveFoodImage(item.image, item.name),
            available: item.available === undefined ? true : Boolean(item.available)
          };
        });
        setFoodList(prev => {
          // Merge with any existing items in cartItemsDetails
          const detailItems = Object.values(cartItemsDetails);
          const combined = [...mappedData];
          detailItems.forEach(d => {
            if (!combined.some(c => String(c._id || c.id) === String(d._id || d.id))) {
              combined.push(d);
            }
          });
          return combined;
        });
      }
    } catch (err) {
      console.log("Failed to fetch food list from backend");
    }
  };

  const loadCartData = async (authToken) => {
    try {
      const response = await fetch(`${url}/api/cart/get`, {
        method: "GET",
        headers: { token: authToken }
      });
      const data = await response.json();
      if (data.success && data.cartData) {
        setcartItems(data.cartData);
      }
    } catch (err) {
      console.error("Failed to load user cart:", err);
    }
  };

  const [categories, setCategories] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [settings, setSettings] = useState({
    restaurantName: 'FastBite',
    logoUrl: null,
    description: 'Delivering your favourite meals hot & fresh right to your doorstep.',
    phone: '+91-6387252549',
    email: 'shubhamkumarmaurya155@gmail.com',
    address: 'Varanasi, Uttar Pradesh, India',
    openingTime: '10:00',
    closingTime: '22:00',
    isOpen: true,
    deliveryFee: 40.0,
    minimumOrderAmount: 199.0,
    currency: 'INR',
    isActive: true
  });

  const loadCategories = async () => {
    try {
      const response = await fetch(`${url}/api/categories`);
      const data = await response.json();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (err) {
      console.log("Failed to load active categories");
    }
  };

  const loadPublicSettings = async () => {
    try {
      const response = await fetch(`${url}/api/settings`);
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.log("Failed to load public restaurant settings");
    }
  };

  const getCurrencySymbol = (currCode) => {
    const c = (currCode || settings?.currency || 'INR').toUpperCase();
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    return '₹';
  };

  const formatCurrency = (val) => {
    const sym = getCurrencySymbol(settings?.currency);
    const amount = Number(val || 0).toFixed(2);
    return `${sym}${amount}`;
  };

  const applyCouponCode = async (code) => {
    const subtotal = getTotalCartAmount();
    if (subtotal <= 0) {
      throw new Error("Add items to your cart before applying a coupon.");
    }
    const response = await fetch(`${url}/api/coupon/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setAppliedCoupon(null);
      throw new Error(data.message || "Invalid coupon code");
    }
    setAppliedCoupon(data.coupon);
    return data;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    return Number(appliedCoupon.discountAmount || 0);
  };

  const getFinalCartTotal = () => {
    const subtotal = getTotalCartAmount();
    if (subtotal === 0) return 0;
    const discount = getDiscountAmount();
    const fee = settings?.deliveryFee !== undefined ? Number(settings.deliveryFee) : 40.0;
    return Math.max(0, subtotal - discount) + fee;
  };

  useEffect(() => {
    async function loadData() {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        await loadCartData(savedToken);
      } else {
        setUserLoading(false);
      }
      // Concurrently fetch initial public storefront data
      await Promise.all([
        fetchFoodList(),
        loadCategories(),
        loadPublicSettings()
      ]);
    }
    loadData();
  }, []);

  // Update user profile whenever token changes (login, mount, or logout)
  useEffect(() => {
    if (token) {
      loadUserProfile(token);
    } else {
      setUser(null);
      setUserLoading(false);
    }
  }, [token]);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    return false;
  };

  const contextValue = {
    url,
    food_list: foodList,
    cartItems,
    setcartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    token,
    setToken,
    user,
    setUser,
    userLoading,
    loadUserProfile,
    loadCartData,
    searchQuery,
    setSearchQuery,
    categories,
    loadCategories,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    getDiscountAmount,
    getFinalCartTotal,
    theme,
    toggleTheme,
    settings,
    loadPublicSettings,
    getCurrencySymbol,
    formatCurrency,
    hasPermission,
    cartRestaurant,
    setCartRestaurant,
    cartConflictModal,
    setCartConflictModal,
    storefrontRestaurant,
    setStorefrontRestaurant,
    cartItemsDetails,
    clearCart,
    clearCartAndAdd
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;

