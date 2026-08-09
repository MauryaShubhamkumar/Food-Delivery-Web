import { querySafe } from '../config/db.js';

// GET active categories for public customer menu
export const getPublicCategories = async (req, res, next) => {
  try {
    const [rows] = await querySafe(
      'SELECT id, name, description, image, is_active FROM categories WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET all categories for Admin with product_count aggregation and search
export const getAdminCategories = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT c.*, COUNT(f.id) as product_count 
      FROM categories c 
      LEFT JOIN food_items f ON (f.category_id = c.id OR f.category = c.name) 
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' GROUP BY c.id ORDER BY c.name ASC';

    const [rows] = await querySafe(query, params);

    const formattedData = rows.map(item => ({
      ...item,
      is_active: Boolean(item.is_active),
      product_count: Number(item.product_count || 0)
    }));

    res.json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};

// CREATE new category
export const createAdminCategory = async (req, res, next) => {
  try {
    const { name, description, is_active } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const cleanName = name.trim();
    if (cleanName.length > 255) {
      return res.status(400).json({ success: false, message: "Category name exceeds maximum length of 255 characters" });
    }

    const pool = getPool();

    // Check for duplicate category name
    const [existing] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [cleanName]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "A category with this name already exists." });
    }

    const activeStatus = is_active === false || is_active === 'false' || is_active === 0 || is_active === '0' ? 0 : 1;

    const [result] = await pool.query(
      'INSERT INTO categories (name, description, is_active) VALUES (?, ?, ?)',
      [cleanName, description ? description.trim() : '', activeStatus]
    );

    const [newRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    const createdCategory = {
      ...newRows[0],
      is_active: Boolean(newRows[0].is_active),
      product_count: 0
    };

    res.status(201).json({
      success: true,
      message: "Category created successfully!",
      data: createdCategory
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE existing category
export const updateAdminCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const cleanName = name.trim();
    const pool = getPool();

    const [currentRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const oldCategory = currentRows[0];

    // Check duplicate name for another category
    const [existing] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?', [cleanName, id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "A category with this name already exists." });
    }

    const activeStatus = is_active === false || is_active === 'false' || is_active === 0 || is_active === '0' ? 0 : 1;

    await pool.query(
      'UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ?',
      [cleanName, description ? description.trim() : '', activeStatus, id]
    );

    // If category name changed, synchronize food_items table string references
    if (oldCategory.name !== cleanName) {
      await pool.query(
        'UPDATE food_items SET category = ? WHERE category_id = ? OR category = ?',
        [cleanName, id, oldCategory.name]
      );
    }

    const [updatedRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    const updatedCategory = {
      ...updatedRows[0],
      is_active: Boolean(updatedRows[0].is_active)
    };

    res.json({
      success: true,
      message: "Category updated successfully!",
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

// DELETE category with product count safety check
export const deleteAdminCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [currentRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const category = currentRows[0];

    // Deletion Safety Check: Count products assigned to this category
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM food_items WHERE category_id = ? OR category = ?',
      [id, category.name]
    );

    const productCount = countRows[0].count;

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Category "${category.name}" contains ${productCount} product${productCount > 1 ? 's' : ''}. You cannot delete this category until its products are reassigned to another category, or deactivate it instead.`
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Category "${category.name}" deleted successfully!`
    });
  } catch (error) {
    next(error);
  }
};

// TOGGLE category status (Active / Inactive)
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [currentRows] = await pool.query('SELECT id, name, is_active FROM categories WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const newStatus = !Boolean(currentRows[0].is_active);

    await pool.query('UPDATE categories SET is_active = ? WHERE id = ?', [newStatus ? 1 : 0, id]);

    res.json({
      success: true,
      message: `Category "${currentRows[0].name}" marked as ${newStatus ? 'Active' : 'Inactive'}`,
      is_active: newStatus
    });
  } catch (error) {
    next(error);
  }
};
