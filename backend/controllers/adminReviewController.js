import { getPool } from '../config/db.js';

// GET all customer reviews for Admin (with search, status filter, rating filter, & pagination)
export const getAdminReviews = async (req, res, next) => {
  try {
    const { status, rating, search, page: reqPage, limit: reqLimit } = req.query;
    const pool = getPool();

    let whereClause = ' WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      if (status === 'Visible') {
        whereClause += " AND r.status = 'visible'";
      } else if (status === 'Hidden') {
        whereClause += " AND r.status = 'hidden'";
      }
    }

    if (rating && rating !== 'All') {
      const numRating = Number(rating);
      if (!isNaN(numRating) && numRating >= 1 && numRating <= 5) {
        whereClause += ' AND r.rating = ?';
        params.push(numRating);
      }
    }

    if (search && search.trim() !== '') {
      const cleanSearch = `%${search.trim()}%`;
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR f.name LIKE ? OR r.comment LIKE ?)';
      params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch);
    }

    // 1. Total matching count
    const [countRows] = await pool.query(
      `SELECT COUNT(r.id) as total 
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN food_items f ON f.id = r.product_id
       ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total || 0);

    // 2. Pagination
    const page = Math.max(1, parseInt(reqPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(reqLimit) || 20));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    // 3. Paginated query
    const query = `
      SELECT 
        r.id, r.user_id, r.product_id, r.order_id, r.rating, r.comment, r.status, r.created_at, r.updated_at,
        u.name as userName, u.email as userEmail,
        f.name as productName, f.image as productImage
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN food_items f ON f.id = r.product_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    res.json({
      success: true,
      count: rows.length,
      page,
      limit,
      total,
      totalPages,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// TOGGLE review visibility status (Visible / Hidden) for Admin
export const toggleReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'visible' | 'hidden'

    const targetStatus = status === 'hidden' ? 'hidden' : 'visible';
    const pool = getPool();

    const [existingRows] = await pool.query('SELECT id, status FROM reviews WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    await pool.query('UPDATE reviews SET status = ? WHERE id = ?', [targetStatus, id]);

    res.json({
      success: true,
      message: `Review #${id} status updated to "${targetStatus}".`,
      status: targetStatus
    });
  } catch (error) {
    next(error);
  }
};

// DELETE review permanently for Admin
export const deleteAdminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [existingRows] = await pool.query('SELECT id FROM reviews WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Review #${id} permanently deleted by administrator.`
    });
  } catch (error) {
    next(error);
  }
};
