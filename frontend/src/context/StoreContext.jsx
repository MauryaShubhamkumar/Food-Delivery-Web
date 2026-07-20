import { createContext, useEffect, useState } from "react";
import { food_list as defaultFoodList } from "../assets/assets";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setcartItems] = useState({});
  const [foodList, setFoodList] = useState(defaultFoodList);
  const [token, setToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const addToCart = async (itemId) => {
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
        let itemInfo = foodList.find((product) => String(product._id || product.id) === String(item));
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
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
          let imageSrc = item.image;
          if (!imageSrc.startsWith('http')) {
            // Find local asset match if available, or static server upload route
            const localMatch = defaultFoodList.find(d => String(d._id) === String(item.id) || d.name === item.name);
            imageSrc = localMatch ? localMatch.image : `${url}/images/${item.image}`;
          }
          return {
            ...item,
            _id: String(item.id),
            image: imageSrc
          };
        });
        setFoodList(mappedData);
      }
    } catch (err) {
      console.log("Backend offline or using default assets food list");
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

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        await loadCartData(savedToken);
      }
    }
    loadData();
  }, []);

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
    loadCartData,
    searchQuery,
    setSearchQuery
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;

