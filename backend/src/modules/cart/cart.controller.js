import { getCartService, addToCartService, removeFromCartService } from './cart.service.js';

export const getCart = async (req, res, next) => {
  try {
    const cartData = await getCartService(req.userId);
    res.json({ success: true, cartData });
  } catch (error) { next(error); }
};

export const addToCart = async (req, res, next) => {
  try {
    await addToCartService(req.userId, req.body);
    res.json({ success: true, message: "Added to cart successfully" });
  } catch (error) {
    if (error.conflict) {
      return res.status(409).json({
        success: false,
        conflict: true,
        currentRestaurant: error.currentRestaurant,
        message: error.message
      });
    }
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    await removeFromCartService(req.userId, req.body.itemId);
    res.json({ success: true, message: "Removed from cart" });
  } catch (error) { next(error); }
};
