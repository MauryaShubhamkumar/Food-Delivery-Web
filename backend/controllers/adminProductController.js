import { getPool } from '../config/db.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// GET all products for Admin with optional search, category, and availability filters
export const getAdminProducts = async (req, res, next) => {
  try {
    const { search, category, available } = req.query;
    const pool = getPool();

    let query = 'SELECT * FROM food_items WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (available !== undefined && available !== 'All' && available !== '') {
      const isAvail = available === 'true' || available === '1';
      query += ' AND available = ?';
      params.push(isAvail ? 1 : 0);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);

    // Format boolean values
    const formattedData = rows.map(item => ({
      ...item,
      available: Boolean(item.available)
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

// CREATE a new product with Cloudinary image upload
export const createAdminProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, available, imageUrl } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: "Food name is required" });
    }

    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Valid price (≥ 0) is required" });
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    let image = imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
    let cloudinaryPublicId = null;

    // Upload to Cloudinary if file provided in request memory buffer
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        'FastBite/products',
        req.file.originalname || name.trim()
      );
      image = uploadResult.secure_url;
      cloudinaryPublicId = uploadResult.public_id;
    }

    const isAvailable = available === 'false' || available === false || available === 0 || available === '0' ? 0 : 1;
    const pool = getPool();

    const [result] = await pool.query(
      'INSERT INTO food_items (name, description, price, category, image, cloudinary_public_id, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), description ? description.trim() : '', Number(price), category.trim(), image, cloudinaryPublicId, isAvailable]
    );

    const [newRows] = await pool.query('SELECT * FROM food_items WHERE id = ?', [result.insertId]);
    const createdProduct = {
      ...newRows[0],
      available: Boolean(newRows[0].available)
    };

    res.status(201).json({
      success: true,
      message: "Food item created successfully!",
      data: createdProduct
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE an existing product with Cloudinary image replacement
export const updateAdminProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [existingRows] = await pool.query('SELECT * FROM food_items WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    const currentProduct = existingRows[0];
    const { name, description, price, category, available, imageUrl } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: "Food name is required" });
    }

    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Valid price (≥ 0) is required" });
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    let image = currentProduct.image;
    let newCloudinaryPublicId = currentProduct.cloudinary_public_id;
    let oldCloudinaryPublicIdToDelete = null;

    if (req.file) {
      // Upload new image to Cloudinary first
      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        'FastBite/products',
        req.file.originalname || name.trim()
      );
      image = uploadResult.secure_url;
      oldCloudinaryPublicIdToDelete = currentProduct.cloudinary_public_id;
      newCloudinaryPublicId = uploadResult.public_id;
    } else if (imageUrl && imageUrl.trim() !== '') {
      image = imageUrl.trim();
    }

    const isAvailable = available === 'false' || available === false || available === 0 || available === '0' ? 0 : 1;

    await pool.query(
      'UPDATE food_items SET name = ?, description = ?, price = ?, category = ?, image = ?, cloudinary_public_id = ?, available = ? WHERE id = ?',
      [name.trim(), description ? description.trim() : '', Number(price), category.trim(), image, newCloudinaryPublicId, isAvailable, id]
    );

    // Delete old Cloudinary asset only after successful DB update
    if (oldCloudinaryPublicIdToDelete) {
      await deleteFromCloudinary(oldCloudinaryPublicIdToDelete);
    }

    const [updatedRows] = await pool.query('SELECT * FROM food_items WHERE id = ?', [id]);
    const updatedProduct = {
      ...updatedRows[0],
      available: Boolean(updatedRows[0].available)
    };

    res.json({
      success: true,
      message: "Food item updated successfully!",
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// DELETE a product safely (with Cloudinary cleanup)
export const deleteAdminProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [existingRows] = await pool.query('SELECT * FROM food_items WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    const product = existingRows[0];

    // Check if product is referenced in order_items
    const [orderRefs] = await pool.query('SELECT COUNT(*) as count FROM order_items WHERE food_id = ?', [id]);

    if (orderRefs[0].count > 0) {
      // Perform soft delete by setting available = FALSE to preserve historical orders
      await pool.query('UPDATE food_items SET available = FALSE WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: `"${product.name}" is referenced in past customer orders. To preserve order history, it has been marked as Unavailable.`,
        softDeleted: true
      });
    }

    // Delete Cloudinary image asset if public ID is present
    if (product.cloudinary_public_id) {
      await deleteFromCloudinary(product.cloudinary_public_id);
    }

    await pool.query('DELETE FROM food_items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `"${product.name}" deleted successfully!`
    });
  } catch (error) {
    next(error);
  }
};

// TOGGLE product availability
export const toggleProductAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [rows] = await pool.query('SELECT id, name, available FROM food_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    const currentAvailability = Boolean(rows[0].available);
    const newAvailability = !currentAvailability;

    await pool.query('UPDATE food_items SET available = ? WHERE id = ?', [newAvailability ? 1 : 0, id]);

    res.json({
      success: true,
      message: `"${rows[0].name}" status updated to ${newAvailability ? 'Available' : 'Unavailable'}`,
      available: newAvailability
    });
  } catch (error) {
    next(error);
  }
};
