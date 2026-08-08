import { getPool } from '../config/db.js';

// GET coupons for Admin with search & status filter
export const getAdminCoupons = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const pool = getPool();

    let query = 'SELECT * FROM coupons WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND code LIKE ?';
      params.push(`%${search.trim().toUpperCase()}%`);
    }

    if (status && status !== 'All') {
      if (status === 'Active') {
        query += ' AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())';
      } else if (status === 'Inactive') {
        query += ' AND is_active = FALSE';
      } else if (status === 'Expired') {
        query += ' AND expires_at IS NOT NULL AND expires_at <= NOW()';
      }
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);

    const formattedCoupons = rows.map((c) => ({
      ...c,
      is_active: Boolean(c.is_active),
      discount_value: Number(c.discount_value),
      minimum_order_amount: Number(c.minimum_order_amount || 0),
      maximum_discount: c.maximum_discount ? Number(c.maximum_discount) : null
    }));

    res.json({
      success: true,
      count: formattedCoupons.length,
      data: formattedCoupons
    });
  } catch (error) {
    next(error);
  }
};

// CREATE new coupon
export const createAdminCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount,
      usage_limit,
      expires_at,
      is_active
    } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const cleanCode = code.trim().toUpperCase();

    if (discount_value === undefined || isNaN(discount_value) || Number(discount_value) <= 0) {
      return res.status(400).json({ success: false, message: "Valid positive discount value is required" });
    }

    const pool = getPool();

    // Check duplicate code
    const [existing] = await pool.query('SELECT id FROM coupons WHERE UPPER(code) = ?', [cleanCode]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "A coupon with this code already exists." });
    }

    const type = discount_type === 'fixed' ? 'fixed' : 'percentage';
    const activeVal = is_active === false || is_active === 'false' || is_active === 0 ? 0 : 1;

    const [result] = await pool.query(
      `INSERT INTO coupons (
        code, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanCode,
        type,
        Number(discount_value),
        minimum_order_amount ? Number(minimum_order_amount) : 0,
        maximum_discount ? Number(maximum_discount) : null,
        usage_limit ? Number(usage_limit) : null,
        expires_at ? new Date(expires_at) : null,
        activeVal
      ]
    );

    const [newRows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      data: {
        ...newRows[0],
        is_active: Boolean(newRows[0].is_active)
      }
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE coupon
export const updateAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount,
      usage_limit,
      expires_at,
      is_active
    } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const pool = getPool();

    const [currentRows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // Check duplicate code for another ID
    const [existing] = await pool.query('SELECT id FROM coupons WHERE UPPER(code) = ? AND id != ?', [cleanCode, id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "A coupon with this code already exists." });
    }

    const type = discount_type === 'fixed' ? 'fixed' : 'percentage';
    const activeVal = is_active === false || is_active === 'false' || is_active === 0 ? 0 : 1;

    await pool.query(
      `UPDATE coupons SET
        code = ?, discount_type = ?, discount_value = ?, minimum_order_amount = ?, maximum_discount = ?, usage_limit = ?, expires_at = ?, is_active = ?
      WHERE id = ?`,
      [
        cleanCode,
        type,
        Number(discount_value),
        minimum_order_amount ? Number(minimum_order_amount) : 0,
        maximum_discount ? Number(maximum_discount) : null,
        usage_limit ? Number(usage_limit) : null,
        expires_at ? new Date(expires_at) : null,
        activeVal,
        id
      ]
    );

    const [updatedRows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Coupon "${cleanCode}" updated successfully!`,
      data: {
        ...updatedRows[0],
        is_active: Boolean(updatedRows[0].is_active)
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE coupon
export const deleteAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [currentRows] = await pool.query('SELECT code FROM coupons WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await pool.query('DELETE FROM coupons WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Coupon "${currentRows[0].code}" deleted successfully!`
    });
  } catch (error) {
    next(error);
  }
};

// TOGGLE coupon status
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [currentRows] = await pool.query('SELECT id, code, is_active FROM coupons WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const newStatus = !Boolean(currentRows[0].is_active);
    await pool.query('UPDATE coupons SET is_active = ? WHERE id = ?', [newStatus ? 1 : 0, id]);

    res.json({
      success: true,
      message: `Coupon "${currentRows[0].code}" marked as ${newStatus ? 'Active' : 'Inactive'}`,
      is_active: newStatus
    });
  } catch (error) {
    next(error);
  }
};

// PUBLIC customer API to validate & calculate coupon discount
export const validateCouponPublic = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ success: false, message: "Please enter a coupon code" });
    }

    const cartSubtotal = Number(subtotal || 0);
    if (cartSubtotal <= 0) {
      return res.status(400).json({ success: false, message: "Add items to your cart before applying a coupon" });
    }

    const cleanCode = code.trim().toUpperCase();
    const pool = getPool();

    const [rows] = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = ?', [cleanCode]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Coupon "${cleanCode}" is invalid or does not exist.` });
    }

    const coupon = rows[0];

    // Validation 1: Active
    if (!coupon.is_active) {
      return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" is currently inactive.` });
    }

    // Validation 2: Expiry
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
      return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" has expired.` });
    }

    // Validation 3: Usage limit
    if (coupon.usage_limit && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
      return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" usage limit has been reached.` });
    }

    // Validation 4: Minimum order amount
    const minOrder = Number(coupon.minimum_order_amount || 0);
    if (cartSubtotal < minOrder) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" requires a minimum order amount of ₹${minOrder.toFixed(2)}.`
      });
    }

    // Calculate Discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartSubtotal * Number(coupon.discount_value)) / 100;
      if (coupon.maximum_discount && Number(coupon.maximum_discount) > 0) {
        discountAmount = Math.min(discountAmount, Number(coupon.maximum_discount));
      }
    } else {
      discountAmount = Math.min(Number(coupon.discount_value), cartSubtotal);
    }

    discountAmount = Math.min(discountAmount, cartSubtotal); // Prevent negative total

    res.json({
      success: true,
      message: `🎉 Coupon "${cleanCode}" applied successfully!`,
      coupon: {
        code: cleanCode,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
        discountAmount: Number(discountAmount.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};
