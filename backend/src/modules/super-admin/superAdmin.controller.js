import {
  getPlatformStatsRepo, getPlatformRestaurantsRepo, getPlatformRestaurantDetailRepo,
  updateRestaurantStatusRepo, findRestaurantById, getPlatformUsersRepo, getPlatformOrdersRepo,
  getPlatformReviewsRepo, togglePlatformReviewVisibilityRepo, getPlatformAnalyticsRepo, getOnboardingStuckRepo
} from './superAdmin.repository.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

export const getPlatformStats = async (req, res, next) => {
  try {
    const { restStats, userStats, orderStats, onboardingStats } = await getPlatformStatsRepo();
    res.json({ success: true, data: { restaurants: { total: Number(restStats[0]?.total||0), active: Number(restStats[0]?.activeCount||0), setup: Number(restStats[0]?.setupCount||0), inactive: Number(restStats[0]?.inactiveCount||0) }, users: { total: Number(userStats[0]?.total||0), customers: Number(userStats[0]?.customersCount||0), owners: Number(userStats[0]?.ownersCount||0) }, orders: { totalOrders: Number(orderStats[0]?.totalOrders||0), totalGMV: Number(orderStats[0]?.totalGMV||0) }, pendingOnboarding: Number(onboardingStats[0]?.pendingOnboarding||0) } });
  } catch (error) { next(error); }
};

export const getPlatformRestaurants = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const { totalCount, dataRows } = await getPlatformRestaurantsRepo({ search: req.query.search, status: req.query.status, page, limit });
    res.json({ success: true, count: dataRows.length, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page, data: dataRows.map(r => ({ ...r, onboarding_completed: Boolean(r.onboarding_completed), product_count: Number(r.product_count||0), order_count: Number(r.order_count||0), gmv: Number(r.gmv||0) })) });
  } catch (error) { next(error); }
};

export const getPlatformRestaurantDetail = async (req, res, next) => {
  try {
    const result = await getPlatformRestaurantDetailRepo(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Restaurant not found." });
    const { restaurant, owner, settings, prodCount, orderStats, reviewStats } = result;
    res.json({ success: true, data: { ...restaurant, onboarding_completed: Boolean(restaurant.onboarding_completed), owner, settings, stats: { productCount: prodCount, orderCount: Number(orderStats.totalOrders||0), totalGMV: Number(orderStats.totalGMV||0), avgRating: reviewStats.avgRating ? Number(reviewStats.avgRating).toFixed(1) : null, totalReviews: Number(reviewStats.totalReviews||0) } } });
  } catch (error) { next(error); }
};

export const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { id } = req.params; const { status } = req.body;
    if (!['active','inactive'].includes(status)) return res.status(400).json({ success: false, message: "Status must be 'active' or 'inactive'." });
    const restaurant = await findRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found." });
    await updateRestaurantStatusRepo(id, status);
    await logAuditEvent({ restaurantId: Number(id), userId: req.userId, action: 'RESTAURANT_STATUS_CHANGED', entityType: 'RESTAURANT', entityId: id, details: { newStatus: status, restaurantName: restaurant.name }, req });
    res.json({ success: true, message: `Restaurant "${restaurant.name}" status updated to ${status.toUpperCase()}.`, status });
  } catch (error) { next(error); }
};

export const getPlatformUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const { totalCount, dataRows } = await getPlatformUsersRepo({ search: req.query.search, role: req.query.role, page, limit });
    res.json({ success: true, count: dataRows.length, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page, data: dataRows.map(u => ({ ...u, is_active: Boolean(u.is_active) })) });
  } catch (error) { next(error); }
};

export const getPlatformOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const { totalCount, orders } = await getPlatformOrdersRepo({ search: req.query.search, status: req.query.status, page, limit });
    res.json({ success: true, count: orders.length, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page, data: orders });
  } catch (error) { next(error); }
};

export const getPlatformReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const { totalCount, rows } = await getPlatformReviewsRepo({ rating: req.query.rating, search: req.query.search, page, limit });
    res.json({ success: true, count: rows.length, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page, data: rows.map(r => ({ ...r, is_visible: Boolean(r.is_visible) })) });
  } catch (error) { next(error); }
};

export const togglePlatformReviewVisibility = async (req, res, next) => {
  try {
    const newStatus = await togglePlatformReviewVisibilityRepo(req.params.id);
    if (newStatus === null) return res.status(404).json({ success: false, message: "Review not found." });
    res.json({ success: true, message: `Review visibility set to ${newStatus ? 'Visible' : 'Hidden'}.`, is_visible: newStatus });
  } catch (error) { next(error); }
};

export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    let dateFilter = "AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    if (period === 'today') dateFilter = "AND DATE(o.created_at) = CURDATE()";
    else if (period === '7d') dateFilter = "AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    else if (period === 'month') dateFilter = "AND MONTH(o.created_at) = MONTH(NOW()) AND YEAR(o.created_at) = YEAR(NOW())";
    else if (period === 'year') dateFilter = "AND YEAR(o.created_at) = YEAR(NOW())";
    const { leaderboard, timeline } = await getPlatformAnalyticsRepo(dateFilter);
    res.json({ success: true, period, data: { leaderboard: leaderboard.map(l => ({ ...l, totalOrders: Number(l.totalOrders||0), gmv: Number(l.gmv||0) })), timeline: timeline.map(t => ({ date: t.date, ordersCount: Number(t.ordersCount||0), dailyGMV: Number(t.dailyGMV||0) })) } });
  } catch (error) { next(error); }
};

export const getOnboardingStuck = async (req, res, next) => {
  try {
    const rows = await getOnboardingStuckRepo();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) { next(error); }
};
