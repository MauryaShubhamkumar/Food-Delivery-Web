import {
  findAdminCoupons, findCouponById, findCouponByCode,
  findPublicCouponByCode, createCouponRepo, updateCouponRepo,
  deleteCouponRepo, toggleCouponStatusRepo
} from './coupon.repository.js';

const formatCoupon = (c) => ({
  ...c,
  is_active: Boolean(c.is_active),
  discount_value: Number(c.discount_value),
  minimum_order_amount: Number(c.minimum_order_amount || 0),
  maximum_discount: c.maximum_discount ? Number(c.maximum_discount) : null
});

export const getAdminCouponsService = async (tenantId, filters) => {
  const rows = await findAdminCoupons(tenantId, filters);
  return rows.map(formatCoupon);
};

export const createAdminCouponService = async (tenantId, body) => {
  const { code, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, expires_at, is_active } = body;
  if (!code || code.trim() === '') { const e = new Error("Coupon code is required"); e.statusCode = 400; throw e; }
  if (discount_value === undefined || isNaN(discount_value) || Number(discount_value) <= 0) { const e = new Error("Valid positive discount value is required"); e.statusCode = 400; throw e; }
  const cleanCode = code.trim().toUpperCase();
  const existing = await findCouponByCode(tenantId, cleanCode);
  if (existing) { const e = new Error("A coupon with this code already exists in your restaurant."); e.statusCode = 400; throw e; }
  const id = await createCouponRepo(tenantId, {
    code: cleanCode,
    type: discount_type === 'fixed' ? 'fixed' : 'percentage',
    discountValue: Number(discount_value),
    minOrder: minimum_order_amount ? Number(minimum_order_amount) : 0,
    maxDiscount: maximum_discount ? Number(maximum_discount) : null,
    usageLimit: usage_limit ? Number(usage_limit) : null,
    expiresAt: expires_at ? new Date(expires_at) : null,
    activeVal: (is_active === false || is_active === 'false' || is_active === 0) ? 0 : 1
  });
  // find the pool to get the new row
  const { getPool } = await import('../../config/db.js');
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);
  return formatCoupon(rows[0]);
};

export const updateAdminCouponService = async (tenantId, couponId, body) => {
  const { code, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, expires_at, is_active } = body;
  if (!code || code.trim() === '') { const e = new Error("Coupon code is required"); e.statusCode = 400; throw e; }
  const cleanCode = code.trim().toUpperCase();
  const current = await findCouponById(couponId, tenantId);
  if (!current) { const e = new Error("Coupon not found or access denied"); e.statusCode = 404; throw e; }
  const dup = await findCouponByCode(tenantId, cleanCode, couponId);
  if (dup) { const e = new Error("A coupon with this code already exists in your restaurant."); e.statusCode = 400; throw e; }
  await updateCouponRepo(couponId, tenantId, {
    code: cleanCode,
    type: discount_type === 'fixed' ? 'fixed' : 'percentage',
    discountValue: Number(discount_value),
    minOrder: minimum_order_amount ? Number(minimum_order_amount) : 0,
    maxDiscount: maximum_discount ? Number(maximum_discount) : null,
    usageLimit: usage_limit ? Number(usage_limit) : null,
    expiresAt: expires_at ? new Date(expires_at) : null,
    activeVal: (is_active === false || is_active === 'false' || is_active === 0) ? 0 : 1
  });
  const updated = await findCouponById(couponId, tenantId);
  return formatCoupon(updated);
};

export const deleteAdminCouponService = async (tenantId, couponId) => {
  const coupon = await findCouponById(couponId, tenantId);
  if (!coupon) { const e = new Error("Coupon not found or access denied"); e.statusCode = 404; throw e; }
  await deleteCouponRepo(couponId, tenantId);
  return coupon.code;
};

export const toggleCouponStatusService = async (tenantId, couponId) => {
  const coupon = await findCouponById(couponId, tenantId);
  if (!coupon) { const e = new Error("Coupon not found or access denied"); e.statusCode = 404; throw e; }
  const newStatus = !Boolean(coupon.is_active);
  await toggleCouponStatusRepo(couponId, tenantId, newStatus);
  return { code: coupon.code, is_active: newStatus };
};

export const validateCouponPublicService = async ({ code, subtotal, restaurant_id }) => {
  if (!code || code.trim() === '') { const e = new Error("Please enter a coupon code"); e.statusCode = 400; throw e; }
  const cartSubtotal = Number(subtotal || 0);
  if (cartSubtotal <= 0) { const e = new Error("Add items to your cart before applying a coupon"); e.statusCode = 400; throw e; }
  const targetId = restaurant_id ? Number(restaurant_id) : 1;
  const cleanCode = code.trim().toUpperCase();
  const coupon = await findPublicCouponByCode(targetId, cleanCode);
  if (!coupon) { const e = new Error(`Coupon "${cleanCode}" is invalid for this restaurant.`); e.statusCode = 404; throw e; }
  if (!coupon.is_active) { const e = new Error(`Coupon "${cleanCode}" is currently inactive.`); e.statusCode = 400; throw e; }
  if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) { const e = new Error(`Coupon "${cleanCode}" has expired.`); e.statusCode = 400; throw e; }
  if (coupon.usage_limit && Number(coupon.used_count) >= Number(coupon.usage_limit)) { const e = new Error(`Coupon "${cleanCode}" usage limit has been reached.`); e.statusCode = 400; throw e; }
  const minOrder = Number(coupon.minimum_order_amount || 0);
  if (cartSubtotal < minOrder) { const e = new Error(`Coupon "${cleanCode}" requires a minimum order amount of \u20b9${minOrder.toFixed(2)}.`); e.statusCode = 400; throw e; }
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (cartSubtotal * Number(coupon.discount_value)) / 100;
    if (coupon.maximum_discount && Number(coupon.maximum_discount) > 0) discountAmount = Math.min(discountAmount, Number(coupon.maximum_discount));
  } else {
    discountAmount = Math.min(Number(coupon.discount_value), cartSubtotal);
  }
  discountAmount = Math.min(discountAmount, cartSubtotal);
  return { code: cleanCode, discountType: coupon.discount_type, discountValue: Number(coupon.discount_value), discountAmount: Number(discountAmount.toFixed(2)) };
};
