import {
  getAdminCouponsService, createAdminCouponService, updateAdminCouponService,
  deleteAdminCouponService, toggleCouponStatusService, validateCouponPublicService
} from './coupon.service.js';

export const getAdminCoupons = async (req, res, next) => {
  try {
    const data = await getAdminCouponsService(req.restaurantId || 1, req.query);
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
};
export const createAdminCoupon = async (req, res, next) => {
  try {
    const data = await createAdminCouponService(req.restaurantId || 1, req.body);
    res.status(201).json({ success: true, message: `Coupon "${data.code}" created successfully!`, data });
  } catch (e) { next(e); }
};
export const updateAdminCoupon = async (req, res, next) => {
  try {
    const data = await updateAdminCouponService(req.restaurantId || 1, req.params.id, req.body);
    res.json({ success: true, message: `Coupon "${data.code}" updated successfully!`, data });
  } catch (e) { next(e); }
};
export const deleteAdminCoupon = async (req, res, next) => {
  try {
    const code = await deleteAdminCouponService(req.restaurantId || 1, req.params.id);
    res.json({ success: true, message: `Coupon "${code}" deleted successfully!` });
  } catch (e) { next(e); }
};
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const result = await toggleCouponStatusService(req.restaurantId || 1, req.params.id);
    res.json({ success: true, message: `Coupon "${result.code}" marked as ${result.is_active ? 'Active' : 'Inactive'}`, is_active: result.is_active });
  } catch (e) { next(e); }
};
export const validateCouponPublic = async (req, res, next) => {
  try {
    const result = await validateCouponPublicService(req.body);
    res.json({ success: true, message: `\uD83C\uDF89 Coupon "${result.code}" applied successfully!`, coupon: result });
  } catch (e) { next(e); }
};
