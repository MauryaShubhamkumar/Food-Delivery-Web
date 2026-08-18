import {
  findProductInfo, findOrderById, findOrderItem, findExistingReview, findReviewById,
  createReviewRepo, updateReviewRepo, deleteReviewRepo,
  getProductReviewStats, getProductReviewsList,
  getAdminReviewsList, toggleReviewStatusRepo, deleteAdminReviewRepo
} from './review.repository.js';

export const createReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId, orderId, rating, comment } = req.body;
    if (!productId || !orderId) return res.status(400).json({ success: false, message: "Product ID and Order ID are required." });
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5 stars." });
    const cleanComment = comment ? String(comment).trim() : '';
    if (cleanComment.length < 5 || cleanComment.length > 1000) return res.status(400).json({ success: false, message: "Review comment must be between 5 and 1000 characters." });
    const product = await findProductInfo(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    const order = await findOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (String(order.user_id) !== String(userId)) return res.status(403).json({ success: false, message: "You can only review products from your own orders." });
    if (order.status !== 'Delivered') return res.status(400).json({ success: false, message: `You can only review products from delivered orders. Current order status is "${order.status}".` });
    const orderItem = await findOrderItem(orderId, productId);
    if (!orderItem) return res.status(400).json({ success: false, message: "This product was not part of the specified order." });
    const existing = await findExistingReview(userId, orderId, productId);
    if (existing) return res.status(400).json({ success: false, message: "You have already reviewed this product for this order." });
    try {
      const data = await createReviewRepo({ restaurantId: product.restaurant_id || 1, userId, productId, orderId, rating: numRating, comment: cleanComment });
      res.status(201).json({ success: true, message: "\uD83C\uDF89 Review submitted successfully!", data });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: "You have already reviewed this product for this order." });
      throw err;
    }
  } catch (error) { next(error); }
};

export const updateReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5 stars." });
    const cleanComment = comment ? String(comment).trim() : '';
    if (cleanComment.length < 5 || cleanComment.length > 1000) return res.status(400).json({ success: false, message: "Review comment must be between 5 and 1000 characters." });
    const review = await findReviewById(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    if (String(review.user_id) !== String(userId)) return res.status(403).json({ success: false, message: "You can only edit your own reviews." });
    const data = await updateReviewRepo(id, numRating, cleanComment);
    res.json({ success: true, message: "Review updated successfully!", data });
  } catch (error) { next(error); }
};

export const deleteReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const review = await findReviewById(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    if (String(review.user_id) !== String(userId)) return res.status(403).json({ success: false, message: "You can only delete your own reviews." });
    await deleteReviewRepo(id);
    res.json({ success: true, message: "Review deleted successfully!" });
  } catch (error) { next(error); }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page: reqPage, limit: reqLimit, sort } = req.query;
    const product = await findProductInfo(productId);
    if (!product) {
      return res.json({
        success: true,
        summary: { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, distributionPct: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        reviews: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
      });
    }
    const stats = await getProductReviewStats(productId);
    const totalReviews = Number(stats.totalReviews || 0);
    const distribution = { 5: Number(stats.count5||0), 4: Number(stats.count4||0), 3: Number(stats.count3||0), 2: Number(stats.count2||0), 1: Number(stats.count1||0) };
    const distributionPct = {};
    [5,4,3,2,1].forEach(k => { distributionPct[k] = totalReviews > 0 ? Math.round((distribution[k] / totalReviews) * 100) : 0; });
    const page = Math.max(1, parseInt(reqPage) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(reqLimit) || 10));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalReviews / limit) || 1;
    let orderByClause = 'ORDER BY r.created_at DESC';
    if (sort === 'highest') orderByClause = 'ORDER BY r.rating DESC, r.created_at DESC';
    else if (sort === 'lowest') orderByClause = 'ORDER BY r.rating ASC, r.created_at DESC';
    const reviewsList = await getProductReviewsList(productId, { limit, offset, orderByClause });
    const formattedReviews = reviewsList.map(r => ({ id: r.id, userId: r.user_id, productId: r.product_id, orderId: r.order_id, rating: r.rating, comment: r.comment, createdAt: r.created_at, updatedAt: r.updated_at, authorName: r.authorName || 'Verified Customer', isVerifiedPurchase: true }));
    res.json({ success: true, summary: { averageRating: Number(stats.averageRating || 0), totalReviews, distribution, distributionPct }, reviews: formattedReviews, page, limit, total: totalReviews, totalPages });
  } catch (error) { next(error); }
};

export const getUserReviewForOrderProduct = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId, orderId } = req.query;
    if (!productId || !orderId) return res.status(400).json({ success: false, message: "productId and orderId are required." });
    const order = await findOrderById(orderId);
    if (!order) return res.json({ success: true, eligible: false, message: "Order not found." });
    if (String(order.user_id) !== String(userId)) return res.json({ success: true, eligible: false, message: "Order does not belong to you." });
    if (order.status !== 'Delivered') return res.json({ success: true, eligible: false, message: `Order is not delivered (Status: ${order.status}).` });
    const orderItem = await findOrderItem(orderId, productId);
    if (!orderItem) return res.json({ success: true, eligible: false, message: "Product not in this order." });
    const review = await findExistingReview(userId, orderId, productId);
    if (review) return res.json({ success: true, eligible: true, alreadyReviewed: true, review });
    res.json({ success: true, eligible: true, alreadyReviewed: false, review: null });
  } catch (error) { next(error); }
};

export const getAdminReviews = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { total, rows } = await getAdminReviewsList(tenantId, {
      search: req.query.search,
      status: req.query.status,
      rating: req.query.rating,
      page,
      limit
    });
    const formatted = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      user_id: r.user_id,
      userName: r.customer_name || 'Guest User',
      customer_name: r.customer_name || 'Guest User',
      userEmail: r.customer_email || '',
      customer_email: r.customer_email || '',
      productId: r.product_id,
      product_id: r.product_id,
      productName: r.product_name || 'Product unavailable',
      product_name: r.product_name || 'Product unavailable',
      productImage: r.product_image || null,
      orderId: r.order_id,
      order_id: r.order_id,
      rating: Number(r.rating || 0),
      comment: r.comment || '',
      status: r.status || 'visible',
      is_visible: Boolean(r.is_visible),
      createdAt: r.created_at,
      created_at: r.created_at
    }));
    res.json({ success: true, count: formatted.length, page, limit, total, totalPages: Math.ceil(total / limit) || 1, data: formatted });
  } catch (error) { next(error); }
};

export const toggleReviewStatus = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const { id } = req.params;
    const pool = (await import('../../config/db.js')).getPool();
    const [rows] = await pool.query('SELECT status FROM reviews WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Review not found or access denied" });
    const newStatus = rows[0].status === 'visible' ? 'hidden' : 'visible';
    await toggleReviewStatusRepo(id, tenantId, newStatus);
    res.json({ success: true, message: `Review ${newStatus === 'visible' ? 'made visible' : 'hidden'} successfully`, status: newStatus });
  } catch (error) { next(error); }
};

export const deleteAdminReview = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const { id } = req.params;
    const pool = (await import('../../config/db.js')).getPool();
    const [rows] = await pool.query('SELECT id FROM reviews WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Review not found or access denied" });
    await deleteAdminReviewRepo(id, tenantId);
    res.json({ success: true, message: "Review deleted successfully!" });
  } catch (error) { next(error); }
};
