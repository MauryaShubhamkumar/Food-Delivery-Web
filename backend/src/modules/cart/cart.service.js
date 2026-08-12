import {
  getCartItems, getFoodRestaurant, getCartRestaurantConflict,
  clearCart, upsertCartItem, getCartItemQty, decrementCartItem, removeCartItem
} from './cart.repository.js';

export const getCartService = async (userId) => {
  const rows = await getCartItems(userId);
  const cartData = {};
  rows.forEach(row => { cartData[row.food_id] = row.quantity; });
  return cartData;
};

export const addToCartService = async (userId, { itemId, clearCart: shouldClear }) => {
  if (!itemId) {
    const e = new Error("Item ID is required"); e.statusCode = 400; throw e;
  }
  const food = await getFoodRestaurant(itemId);
  if (!food) {
    const e = new Error("Food item not found"); e.statusCode = 404; throw e;
  }
  const itemRestaurantId = food.restaurant_id || 1;
  const cartCheck = await getCartRestaurantConflict(userId);
  if (cartCheck.length > 0 && cartCheck[0].restaurant_id !== itemRestaurantId) {
    if (shouldClear) {
      await clearCart(userId);
    } else {
      const currentRestName = cartCheck[0].restaurant_name || 'another restaurant';
      const e = new Error(`Your cart contains items from "${currentRestName}". Clear your cart to add items from this restaurant.`);
      e.statusCode = 409;
      e.conflict = true;
      e.currentRestaurant = currentRestName;
      throw e;
    }
  }
  await upsertCartItem(userId, itemId);
};

export const removeFromCartService = async (userId, itemId) => {
  if (!itemId) {
    const e = new Error("Item ID is required"); e.statusCode = 400; throw e;
  }
  const qty = await getCartItemQty(userId, itemId);
  if (qty > 1) {
    await decrementCartItem(userId, itemId);
  } else if (qty === 1) {
    await removeCartItem(userId, itemId);
  }
};
