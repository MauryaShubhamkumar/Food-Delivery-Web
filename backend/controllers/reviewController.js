import { getPool } from '../config/db.js';

// CREATE review (Customer endpoint)
export const createReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId, orderId, rating, comment } = req.body;

    // 1. Basic field presence checks
    if (!productId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Product ID and Order ID are required."
      });
    }

    // 2. Validate rating (must be an integer from 1 to 5)
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5 stars."
      });
    }

    // 3. Validate comment (5 to 1000 chars, trimmed)
    const cleanComment = comment ? String(comment).trim() : '';
    if (cleanComment.length < 5 || cleanComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be between 5 and 1000 characters."
      });
    }

    const pool = getPool();

    // 4. Verify product exists
    const [productRows] = await pool.query('SELECT id, name FROM food_items WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    // 5. Verify order exists and belongs to the authenticated user
    const [orderRows] = await pool.query('SELECT id, user_id, status FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    const order = orderRows[0];
    if (String(order.user_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only review products from your own orders."
      });
    }

    // 6. Verify order is Delivered / completed
    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: `You can only review products from delivered orders. Current order status is "${order.status}".`
      });
    }

    // 7. Verify product exists in that specific order
    const [itemRows] = await pool.query(
      'SELECT id FROM order_items WHERE order_id = ? AND food_id = ?',
      [orderId, productId]
    );

    if (itemRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This product was not part of the specified order."
      });
    }

    // 8. Check for existing review (Duplicate prevention)
    const [existingRows] = await pool.query(
      'SELECT id FROM reviews WHERE user_id = ? AND order_id = ? AND product_id = ?',
      [userId, orderId, productId]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product for this order."
      });
    }

    // 9. Insert review
    try {
      const [insertResult] = await pool.query(
        `INSERT INTO reviews (user_id, product_id, order_id, rating, comment, status) VALUES (?, ?, ?, ?, ?, 'visible')`,
        [userId, productId, orderId, numRating, cleanComment]
      );

      const [newReviewRows] = await pool.query(
        `SELECT r.id, r.rating, r.comment, r.status, r.created_at, u.name as authorName 
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.id = ?`,
        [insertResult.insertId]
      );

      res.status(201).json({
        success: true,
        message: "🎉 Review submitted successfully!",
        data: newReviewRows[0]
      });
    } catch (insertErr) {
      if (insertErr.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this product for this order."
        });
      }
      throw insertErr;
    }
  } catch (error) {
    next(error);
  }
};

// UPDATE review (Customer endpoint)
export const updateReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params; // reviewId
    const { rating, comment } = req.body;

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5 stars."
      });
    }

    const cleanComment = comment ? String(comment).trim() : '';
    if (cleanComment.length < 5 || cleanComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be between 5 and 1000 characters."
      });
    }

    const pool = getPool();
    const [existingRows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const review = existingRows[0];
    if (String(review.user_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews."
      });
    }

    await pool.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [numRating, cleanComment, id]
    );

    const [updatedRows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.status, r.created_at, r.updated_at, u.name as authorName 
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Review updated successfully!",
      data: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE review (Customer endpoint)
export const deleteReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const pool = getPool();
    const [existingRows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const review = existingRows[0];
    if (String(review.user_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews."
      });
    }

    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);

    res.json({
      success: true,
      message: "Review deleted successfully!"
    });
  } catch (error) {
    next(error);
  }
};

// GET product reviews with rating summary & pagination (Public endpoint)
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page: reqPage, limit: reqLimit, sort } = req.query;

    const pool = getPool();

    // Verify product exists
    const [productRows] = await pool.query('SELECT id, name FROM food_items WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // 1. Rating Summary Stats (Only visible reviews)
    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(id) as totalReviews,
        COALESCE(ROUND(AVG(rating), 1), 0) as averageRating,
        COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as count5,
        COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as count4,
        COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as count3,
        COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as count2,
        COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as count1
      FROM reviews
      WHERE product_id = ? AND status = 'visible'
    `, [productId]);

    const stats = summaryRows[0] || {};
    const totalReviews = Number(stats.totalReviews || 0);

    const distribution = {
      5: Number(stats.count5 || 0),
      4: Number(stats.count4 || 0),
      3: Number(stats.count3 || 0),
      2: Number(stats.count2 || 0),
      1: Number(stats.count1 || 0)
    };

    // Calculate percentage breakdown
    const distributionPct = {
      5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0
    };

    // 2. Pagination calculation
    const page = Math.max(1, parseInt(reqPage) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(reqLimit) || 10));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalReviews / limit) || 1;

    // 3. Sorting whitelist
    let orderByClause = 'ORDER BY r.created_at DESC';
    if (sort === 'highest') {
      orderByClause = 'ORDER BY r.rating DESC, r.created_at DESC';
    } else if (sort === 'lowest') {
      orderByClause = 'ORDER BY r.rating ASC, r.created_at DESC';
    }

    // 4. Fetch reviews list
    const [reviewsList] = await pool.query(`
      SELECT 
        r.id, r.user_id, r.product_id, r.order_id, r.rating, r.comment, r.created_at, r.updated_at,
        u.name as authorName
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? AND r.status = 'visible'
      ${orderByClause}
      LIMIT ? OFFSET ?
    `, [productId, limit, offset]);

    const formattedReviews = reviewsList.map(r => ({
      id: r.id,
      userId: r.user_id,
      productId: r.product_id,
      orderId: r.order_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      authorName: r.authorName || 'Verified Customer',
      isVerifiedPurchase: true // All reviews in our system come from verified delivered orders
    }));

    res.json({
      success: true,
      summary: {
        averageRating: Number(stats.averageRating || 0),
        totalReviews,
        distribution,
        distributionPct
      },
      reviews: formattedReviews,
      page,
      limit,
      total: totalReviews,
      totalPages
    });
  } catch (error) {
    next(error);
  }
};

// CHECK review eligibility & fetch existing review for order/product (Customer endpoint)
export const getUserReviewForOrderProduct = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId, orderId } = req.query;

    if (!productId || !orderId) {
      return res.status(400).json({ success: false, message: "productId and orderId are required." });
    }

    const pool = getPool();

    // 1. Check order ownership & status
    const [orderRows] = await pool.query('SELECT user_id, status FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) {
      return res.json({ success: true, eligible: false, message: "Order not found." });
    }

    const order = orderRows[0];
    if (String(order.user_id) !== String(userId)) {
      return res.json({ success: true, eligible: false, message: "Order does not belong to you." });
    }

    if (order.status !== 'Delivered') {
      return res.json({ success: true, eligible: false, message: `Order is not delivered (Status: ${order.status}).` });
    }

    // 2. Check product in order
    const [itemRows] = await pool.query('SELECT id FROM order_items WHERE order_id = ? AND food_id = ?', [orderId, productId]);
    if (itemRows.length === 0) {
      return res.json({ success: true, eligible: false, message: "Product not in this order." });
    }

    // 3. Check existing review
    const [reviewRows] = await pool.query('SELECT * FROM reviews WHERE user_id = ? AND order_id = ? AND product_id = ?', [userId, orderId, productId]);

    if (reviewRows.length > 0) {
      return res.json({
        success: true,
        eligible: true,
        alreadyReviewed: true,
        review: reviewRows[0]
      });
    }

    res.json({
      success: true,
      eligible: true,
      alreadyReviewed: false,
      review: null
    });
  } catch (error) {
    next(error);
  }
};
