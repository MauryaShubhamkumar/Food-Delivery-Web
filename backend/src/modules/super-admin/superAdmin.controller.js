import jwt from 'jsonwebtoken';
import {
  getPlatformStatsRepo, getPlatformRestaurantsRepo, getPlatformRestaurantDetailRepo,
  updateRestaurantStatusRepo, findRestaurantById, findRestaurantOwnerByRestaurantId, getPlatformUsersRepo, getPlatformOrdersRepo,
  getPlatformReviewsRepo, togglePlatformReviewVisibilityRepo, getPlatformAnalyticsRepo, getOnboardingStuckRepo,
  updateRestaurantCommissionRepo, getRevenueLedgerRepo
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

export const updatePlatformUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, is_active } = req.body;
    const targetStatus = isActive !== undefined ? Boolean(isActive) : Boolean(is_active);

    if (Number(req.userId) === Number(id)) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own Super Admin account." });
    }

    const { getPool } = await import('../../config/db.js');
    const pool = getPool();
    const [userRows] = await pool.query('SELECT id, name, role FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [targetStatus ? 1 : 0, id]);
    res.json({
      success: true,
      message: `User account "${userRows[0].name}" ${targetStatus ? 'activated' : 'deactivated'} successfully.`,
      isActive: targetStatus
    });
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

export const impersonateRestaurant = async (req, res, next) => {
  try {
    const restaurantId = Number(req.params.id);
    if (!restaurantId || isNaN(restaurantId)) {
      return res.status(400).json({ success: false, message: "Valid restaurant ID is required." });
    }

    const restaurant = await findRestaurantById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    const owner = await findRestaurantOwnerByRestaurantId(restaurantId);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: `No active owner account assigned to "${restaurant.name}". Please ensure an owner user exists.`
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: "JWT secret configuration missing." });
    }

    // Sign impersonation token with claims
    const token = jwt.sign(
      { id: owner.id, isImpersonated: true, originalAdminId: req.userId },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // Audit log
    await logAuditEvent({
      restaurantId,
      userId: req.userId,
      action: 'SUPER_ADMIN_IMPERSONATION_STARTED',
      entityType: 'RESTAURANT',
      entityId: restaurantId,
      details: { targetUserId: owner.id, targetOwnerEmail: owner.email, restaurantName: restaurant.name },
      req
    });

    res.json({
      success: true,
      message: `Impersonation started for "${restaurant.name}"`,
      token,
      isImpersonated: true,
      targetUser: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: 'restaurant_owner',
        restaurant_id: restaurantId,
        avatar_url: owner.avatar_url || null
      },
      targetRestaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url
      }
    });
  } catch (error) { next(error); }
};

export const getPlatformRevenueLedger = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    let dateFilter = "AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    if (period === 'today') dateFilter = "AND DATE(o.created_at) = CURDATE()";
    else if (period === '7d') dateFilter = "AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    else if (period === 'month') dateFilter = "AND MONTH(o.created_at) = MONTH(NOW()) AND YEAR(o.created_at) = YEAR(NOW())";
    else if (period === 'year') dateFilter = "AND YEAR(o.created_at) = YEAR(NOW())";
    else if (period === 'all') dateFilter = "";

    const { summary, stores, timeline } = await getRevenueLedgerRepo(dateFilter);

    res.json({
      success: true,
      period,
      data: {
        summary: {
          totalOrders: Number(summary.totalOrders || 0),
          totalGMV: Number(summary.totalGMV || 0),
          totalPlatformEarnings: Number(summary.totalPlatformEarnings || 0),
          netStorePayouts: Number(summary.totalGMV || 0) - Number(summary.totalPlatformEarnings || 0),
          avgCommissionRate: Number(summary.avgCommissionRate || 5.00)
        },
        stores: stores.map(s => ({
          ...s,
          commission_rate: Number(s.commission_rate || 5.00),
          completedOrders: Number(s.completedOrders || 0),
          storeGMV: Number(s.storeGMV || 0),
          platformEarnings: Number(s.platformEarnings || 0),
          netStorePayout: Number(s.netStorePayout || 0)
        })),
        timeline: timeline.map(t => ({
          date: t.date,
          ordersCount: Number(t.ordersCount || 0),
          dailyGMV: Number(t.dailyGMV || 0),
          dailyEarnings: Number(t.dailyEarnings || 0)
        }))
      }
    });
  } catch (error) { next(error); }
};

export const updateRestaurantCommission = async (req, res, next) => {
  try {
    const restaurantId = Number(req.params.id);
    const { commissionRate } = req.body;

    if (isNaN(restaurantId)) {
      return res.status(400).json({ success: false, message: "Valid restaurant ID is required." });
    }

    const rateNum = Number(commissionRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      return res.status(400).json({ success: false, message: "Commission rate must be a valid percentage between 0% and 100%." });
    }

    const restaurant = await findRestaurantById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    await updateRestaurantCommissionRepo(restaurantId, rateNum);

    await logAuditEvent({
      restaurantId,
      userId: req.userId,
      action: 'SUPER_ADMIN_COMMISSION_UPDATED',
      entityType: 'RESTAURANT',
      entityId: restaurantId,
      details: { oldRate: restaurant.commission_rate, newRate: rateNum },
      req
    });

    res.json({
      success: true,
      message: `Commission rate for "${restaurant.name}" updated to ${rateNum.toFixed(2)}%`,
      commissionRate: rateNum
    });
  } catch (error) { next(error); }
};

