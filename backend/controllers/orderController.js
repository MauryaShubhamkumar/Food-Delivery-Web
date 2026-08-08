import { getPool } from '../config/db.js';

// Place user order
export const placeOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { items, amount, address, couponCode, paymentMethod = 'cod', paymentReference } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order items cannot be empty" });
    }

    if (!address || !amount) {
      return res.status(400).json({ success: false, message: "Delivery address and total amount are required" });
    }

    const cleanPaymentMethod = (paymentMethod || 'cod').toLowerCase();
    if (!['cod', 'upi'].includes(cleanPaymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method selected. Choose Cash on Delivery or UPI." });
    }

    let cleanPaymentRef = null;
    let initialPaymentStatus = 'pending';

    if (cleanPaymentMethod === 'upi') {
      if (!paymentReference || typeof paymentReference !== 'string' || paymentReference.trim() === '') {
        return res.status(400).json({ success: false, message: "UTR / Transaction ID is required for UPI payments." });
      }

      cleanPaymentRef = paymentReference.trim();

      // UTR Format Validation (6-50 alphanumeric characters or hyphens)
      const utrRegex = /^[a-zA-Z0-9_-]{6,50}$/;
      if (!utrRegex.test(cleanPaymentRef)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid UTR / Transaction ID (6-50 alphanumeric characters)."
        });
      }

      const pool = getPool();
      // Duplicate UTR Protection
      const [dupRows] = await pool.query(
        "SELECT id FROM orders WHERE payment_method = 'upi' AND UPPER(payment_reference) = UPPER(?) AND payment_status NOT IN ('rejected', 'failed')",
        [cleanPaymentRef]
      );

      if (dupRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This UTR / Transaction ID has already been submitted for another order. Please verify your transaction details."
        });
      }

      initialPaymentStatus = 'verification_required';
    }

    const pool = getPool();

    // 0. Fetch Restaurant Settings for open status, minimum order amount, and delivery fee
    const [settingsRows] = await pool.query('SELECT * FROM restaurant_settings LIMIT 1');
    const settings = settingsRows.length > 0 ? settingsRows[0] : {
      is_open: true,
      is_active: true,
      minimum_order_amount: 199.00,
      delivery_fee: 40.00,
      currency: 'INR'
    };

    if (!settings.is_open || !settings.is_active) {
      return res.status(400).json({
        success: false,
        message: "The restaurant is currently closed for new orders. Please try again during operating hours."
      });
    }

    // 1. Calculate subtotal securely using DB stored item prices
    let calculatedSubtotal = 0;
    const itemsToInsert = [];

    for (const item of items) {
      const foodId = item._id || item.id;
      const [foodRows] = await pool.query('SELECT name, price, available FROM food_items WHERE id = ?', [foodId]);
      
      let price = Number(item.price);
      let name = item.name;
      
      if (foodRows.length > 0) {
        price = Number(foodRows[0].price);
        name = foodRows[0].name;
        if (foodRows[0].available === false || foodRows[0].available === 0) {
          return res.status(400).json({ success: false, message: `"${name}" is currently out of stock.` });
        }
      }
      
      const quantity = Math.max(1, Number(item.quantity) || 1);
      calculatedSubtotal += price * quantity;
      itemsToInsert.push({ foodId, name, price, quantity });
    }

    // Validate Minimum Order Amount
    const minOrderReq = Number(settings.minimum_order_amount || 0);
    if (calculatedSubtotal < minOrderReq) {
      const remainingNeeded = (minOrderReq - calculatedSubtotal).toFixed(2);
      return res.status(400).json({
        success: false,
        message: `Minimum order requirement is ${settings.currency || 'INR'} ${minOrderReq.toFixed(2)}. Please add ${settings.currency || 'INR'} ${remainingNeeded} more to your cart.`
      });
    }

    // 2. Validate Coupon & calculate discount securely on backend
    let discountAmount = 0;
    let appliedCouponCode = null;
    let cpToIncrement = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
      const cleanCode = couponCode.trim().toUpperCase();
      const [cpRows] = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = ?', [cleanCode]);

      if (cpRows.length === 0) {
        return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" is invalid.` });
      }

      const cp = cpRows[0];
      if (!cp.is_active) {
        return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" is inactive.` });
      }
      if (cp.expires_at && new Date(cp.expires_at) <= new Date()) {
        return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" has expired.` });
      }
      if (cp.usage_limit && Number(cp.used_count) >= Number(cp.usage_limit)) {
        return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" usage limit reached.` });
      }
      if (calculatedSubtotal < Number(cp.minimum_order_amount || 0)) {
        return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" requires minimum order of ${settings.currency || 'INR'} ${cp.minimum_order_amount}.` });
      }

      if (cp.discount_type === 'percentage') {
        discountAmount = (calculatedSubtotal * Number(cp.discount_value)) / 100;
        if (cp.maximum_discount && Number(cp.maximum_discount) > 0) {
          discountAmount = Math.min(discountAmount, Number(cp.maximum_discount));
        }
      } else {
        discountAmount = Math.min(Number(cp.discount_value), calculatedSubtotal);
      }
      discountAmount = Math.min(discountAmount, calculatedSubtotal);
      appliedCouponCode = cleanCode;
      cpToIncrement = cp;
    }

    const deliveryFeeVal = Number(settings.delivery_fee !== undefined ? settings.delivery_fee : 40.00);
    const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount) + deliveryFeeVal;

    // 3. Begin MySQL Transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Increment coupon usage count inside transaction
      if (cpToIncrement) {
        await connection.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [cpToIncrement.id]);
      }

      const orderQuery = `
        INSERT INTO orders (
          user_id, first_name, last_name, email, street, city, state, zip_code, country, phone, amount, discount_amount, coupon_code, status, payment, payment_method, payment_status, payment_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      const [orderResult] = await connection.query(orderQuery, [
        userId,
        address.firstName || '',
        address.lastName || '',
        address.email || '',
        address.street || '',
        address.city || '',
        address.state || '',
        address.zipCode || '',
        address.country || '',
        address.phone || '',
        calculatedTotal,
        discountAmount,
        appliedCouponCode,
        'Pending',
        false, // Payment is false until verified or COD completed
        cleanPaymentMethod,
        initialPaymentStatus,
        cleanPaymentRef
      ]);

      const orderId = orderResult.insertId;

      const itemQuery = `
        INSERT INTO order_items (order_id, food_id, name, price, quantity)
        VALUES (?, ?, ?, ?, ?);
      `;

      for (const item of itemsToInsert) {
        await connection.query(itemQuery, [
          orderId,
          item.foodId,
          item.name,
          item.price,
          item.quantity
        ]);
      }

      // Clear user's cart in MySQL
      await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: cleanPaymentMethod === 'upi'
          ? "Order placed successfully! Payment verification pending."
          : "Order placed successfully!",
        orderId,
        paymentStatus: initialPaymentStatus
      });
    } catch (txnError) {
      await connection.rollback();
      connection.release();
      throw txnError;
    }
  } catch (error) {
    next(error);
  }
};

// Fetch orders for current logged-in user
export const userOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const pool = getPool();

    const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [allItems] = await pool.query(
        'SELECT id, order_id, food_id, name, price, quantity FROM order_items WHERE order_id IN (?)',
        [orderIds]
      );

      const itemsByOrderId = {};
      for (const item of allItems) {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push(item);
      }

      for (const order of orders) {
        order.items = itemsByOrderId[order.id] || [];
      }
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};
