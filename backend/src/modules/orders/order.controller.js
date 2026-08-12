import {
  placeOrderService, userOrdersService, getAdminOrdersService, getAdminOrderDetailsService,
  updateAdminOrderStatusService, approveAdminPaymentService, rejectAdminPaymentService
} from './order.service.js';

export const placeOrder = async (req, res, next) => {
  try {
    const result = await placeOrderService(req.userId, req.body);
    res.status(201).json({ success: true, message: result.cleanPaymentMethod === 'upi' ? "Order placed successfully! Payment verification pending." : "Order placed successfully!", orderId: result.orderId, paymentStatus: result.paymentStatus });
  } catch (error) { next(error); }
};

export const userOrders = async (req, res, next) => {
  try {
    const data = await userOrdersService(req.userId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const result = await getAdminOrdersService(req.restaurantId || 1, req.query);
    res.json({ success: true, count: result.orders.length, page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages, data: result.orders });
  } catch (error) { next(error); }
};

export const getAdminOrderDetails = async (req, res, next) => {
  try {
    const data = await getAdminOrderDetailsService(req.params.id, req.restaurantId || 1);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const updatedOrder = await updateAdminOrderStatusService(req.params.id, req.restaurantId || 1, req.body.status, req.userRole || 'customer', req.userId);
    res.json({ success: true, message: `Order #${req.params.id} status updated to "${req.body.status}"`, data: updatedOrder });
  } catch (error) { next(error); }
};

export const approveAdminPayment = async (req, res, next) => {
  try {
    const result = await approveAdminPaymentService(req.params.id, req.restaurantId || 1, req.userId, req);
    res.json({ success: true, message: `Payment for Order #${req.params.id} approved! Order status: "${result.newOrderStatus}".`, data: result.order });
  } catch (error) { next(error); }
};

export const rejectAdminPayment = async (req, res, next) => {
  try {
    const data = await rejectAdminPaymentService(req.params.id, req.restaurantId || 1, req.userId, req.body.reason, req);
    res.json({ success: true, message: `Payment for Order #${req.params.id} rejected.`, data });
  } catch (error) { next(error); }
};
