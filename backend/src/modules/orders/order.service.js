import {
  findFoodItem, findDuplicateUTR, findRestaurantSettings, findCoupon,
  placeOrderTransaction, findUserOrders, findAdminOrders, findAdminOrderById,
  updateOrderStatus, restoreStockOnCancellation, approvePaymentRepo, rejectPaymentRepo
} from './order.repository.js';
import { getPool } from '../../config/db.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

const VALID_TRANSITIONS = {
  'Pending': ['Confirmed', 'Cancelled'],
  'Food Processing': ['Confirmed', 'Preparing', 'Cancelled'],
  'Confirmed': ['Preparing', 'Cancelled'],
  'Preparing': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': []
};
const VALID_STATUS_LIST = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export const placeOrderService = async (userId, { items, amount, address, couponCode, paymentMethod = 'cod', paymentReference }) => {
  if (!items || items.length === 0) { const e = new Error("Order items cannot be empty"); e.statusCode = 400; throw e; }
  if (!address || !amount) { const e = new Error("Delivery address and total amount are required"); e.statusCode = 400; throw e; }
  const cleanPaymentMethod = (paymentMethod || 'cod').toLowerCase();
  if (!['cod', 'upi'].includes(cleanPaymentMethod)) { const e = new Error("Invalid payment method selected. Choose Cash on Delivery or UPI."); e.statusCode = 400; throw e; }
  let cleanPaymentRef = null; let initialPaymentStatus = 'pending';
  if (cleanPaymentMethod === 'upi') {
    if (!paymentReference || typeof paymentReference !== 'string' || paymentReference.trim() === '') { const e = new Error("UTR / Transaction ID is required for UPI payments."); e.statusCode = 400; throw e; }
    cleanPaymentRef = paymentReference.trim();
    if (!/^[a-zA-Z0-9_-]{6,50}$/.test(cleanPaymentRef)) { const e = new Error("Please enter a valid UTR / Transaction ID (6-50 alphanumeric characters)."); e.statusCode = 400; throw e; }
    const dup = await findDuplicateUTR(cleanPaymentRef);
    if (dup) { const e = new Error("This UTR / Transaction ID has already been submitted for another order. Please verify your transaction details."); e.statusCode = 400; throw e; }
    initialPaymentStatus = 'verification_required';
  }
  const pool = getPool();
  let calculatedSubtotal = 0;
  const itemsToInsert = [];
  let orderRestaurantId = null;
  for (const item of items) {
    const foodId = item._id || item.id;
    const food = await findFoodItem(foodId);
    let price = Number(item.price); let name = item.name; let itemRestaurantId = 1;
    if (food) {
      price = Number(food.price); name = food.name; itemRestaurantId = food.restaurant_id || 1;
      if (food.available === false || food.available === 0) { const e = new Error(`"${name}" is currently out of stock.`); e.statusCode = 400; throw e; }
    }
    if (orderRestaurantId === null) orderRestaurantId = itemRestaurantId;
    else if (orderRestaurantId !== itemRestaurantId) { const e = new Error("All items in a single order must belong to the same restaurant."); e.statusCode = 400; throw e; }
    const quantity = Math.max(1, Number(item.quantity) || 1);
    calculatedSubtotal += price * quantity;
    itemsToInsert.push({ foodId, name, price, quantity });
  }
  if (!orderRestaurantId) orderRestaurantId = 1;
  const settings = await findRestaurantSettings(orderRestaurantId);
  const s = settings || { is_open: true, is_active: true, minimum_order_amount: 199.00, delivery_fee: 40.00, currency: 'INR' };
  if (!s.is_open || !s.is_active) { const e = new Error("The restaurant is currently closed for new orders."); e.statusCode = 400; throw e; }
  const minOrderReq = Number(s.minimum_order_amount || 0);
  if (calculatedSubtotal < minOrderReq) { const e = new Error(`Minimum order requirement is ${s.currency || 'INR'} ${minOrderReq.toFixed(2)}.`); e.statusCode = 400; throw e; }
  let discountAmount = 0; let appliedCouponCode = null; let couponId = null;
  if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
    const cleanCode = couponCode.trim().toUpperCase();
    const cp = await findCoupon(orderRestaurantId, cleanCode);
    if (!cp) { const e = new Error(`Coupon "${cleanCode}" is invalid for this restaurant.`); e.statusCode = 400; throw e; }
    if (!cp.is_active) { const e = new Error(`Coupon "${cleanCode}" is inactive.`); e.statusCode = 400; throw e; }
    if (cp.expires_at && new Date(cp.expires_at) <= new Date()) { const e = new Error(`Coupon "${cleanCode}" has expired.`); e.statusCode = 400; throw e; }
    if (cp.usage_limit && Number(cp.used_count) >= Number(cp.usage_limit)) { const e = new Error(`Coupon "${cleanCode}" usage limit reached.`); e.statusCode = 400; throw e; }
    if (calculatedSubtotal < Number(cp.minimum_order_amount || 0)) { const e = new Error(`Coupon "${cleanCode}" requires a minimum order.`); e.statusCode = 400; throw e; }
    if (cp.discount_type === 'percentage') {
      discountAmount = (calculatedSubtotal * Number(cp.discount_value)) / 100;
      if (cp.maximum_discount && Number(cp.maximum_discount) > 0) discountAmount = Math.min(discountAmount, Number(cp.maximum_discount));
    } else discountAmount = Math.min(Number(cp.discount_value), calculatedSubtotal);
    discountAmount = Math.min(discountAmount, calculatedSubtotal);
    appliedCouponCode = cleanCode; couponId = cp.id;
  }
  const deliveryFeeVal = Number(s.delivery_fee !== undefined ? s.delivery_fee : 40.00);
  const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount) + deliveryFeeVal;
  const orderId = await placeOrderTransaction(pool, { userId, restaurantId: orderRestaurantId, address, calculatedTotal, discountAmount, appliedCouponCode, cleanPaymentMethod, initialPaymentStatus, cleanPaymentRef, itemsToInsert, couponId });
  return { orderId, paymentStatus: initialPaymentStatus, cleanPaymentMethod };
};

export const userOrdersService = async (userId) => findUserOrders(userId);

export const getAdminOrdersService = async (tenantId, query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return findAdminOrders(tenantId, { status: query.status, paymentStatus: query.paymentStatus, search: query.search, page, limit });
};

export const getAdminOrderDetailsService = async (id, tenantId) => {
  const order = await findAdminOrderById(id, tenantId);
  if (!order) { const e = new Error("Order not found or access denied"); e.statusCode = 404; throw e; }
  return order;
};

export const updateAdminOrderStatusService = async (id, tenantId, status, userRole, userId) => {
  if (!status || !VALID_STATUS_LIST.includes(status)) { const e = new Error(`Invalid status. Valid choices: ${VALID_STATUS_LIST.join(', ')}`); e.statusCode = 400; throw e; }
  const order = await findAdminOrderById(id, tenantId);
  if (!order) { const e = new Error("Order not found or access denied"); e.statusCode = 404; throw e; }
  const currentStatus = order.status || 'Pending';
  if (currentStatus === status) return order;
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(status)) { const e = new Error(`Invalid transition from "${currentStatus}" to "${status}". Allowed: ${allowedNext.join(', ') || 'None'}`); e.statusCode = 400; throw e; }
  await updateOrderStatus(id, tenantId, status);
  if (status === 'Cancelled' && currentStatus !== 'Cancelled') await restoreStockOnCancellation(id, tenantId, userId);
  return findAdminOrderById(id, tenantId);
};

export const approveAdminPaymentService = async (id, tenantId, adminId, req) => {
  const order = await findAdminOrderById(id, tenantId);
  if (!order) { const e = new Error("Order not found or access denied"); e.statusCode = 404; throw e; }
  if (order.payment_status === 'paid') { const e = new Error("Payment already marked as Paid."); e.statusCode = 400; throw e; }
  let newOrderStatus = order.status;
  if (order.status === 'Pending' || order.status === 'Food Processing') newOrderStatus = 'Confirmed';
  const updatedOrder = await approvePaymentRepo(id, tenantId, adminId, newOrderStatus);
  await logAuditEvent({ restaurantId: tenantId, userId: adminId, action: 'PAYMENT_APPROVED', entityType: 'ORDER', entityId: id, details: { amount: updatedOrder.amount, paymentMethod: updatedOrder.payment_method, reference: updatedOrder.payment_reference }, req });
  return { order: updatedOrder, newOrderStatus };
};

export const rejectAdminPaymentService = async (id, tenantId, userId, reason, req) => {
  const order = await findAdminOrderById(id, tenantId);
  if (!order) { const e = new Error("Order not found or access denied"); e.statusCode = 404; throw e; }
  const cleanReason = reason && typeof reason === 'string' ? reason.trim() : 'Payment reference could not be verified.';
  const updatedOrder = await rejectPaymentRepo(id, tenantId, cleanReason);
  await logAuditEvent({ restaurantId: tenantId, userId, action: 'PAYMENT_REJECTED', entityType: 'ORDER', entityId: id, details: { reason: cleanReason }, req });
  return updatedOrder;
};
