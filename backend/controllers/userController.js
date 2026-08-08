import { getPool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_food_del_jwt_key_2026', {
    expiresIn: '7d'
  });
};

// Login user
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const user = rows[0];

    if (user.is_active === false || user.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact the administrator."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user.id);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'customer',
        avatar_url: user.avatar_url || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Register user
export const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const pool = getPool();

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database with default role 'customer'
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'customer']
    );

    const token = createToken(result.insertId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: 'customer',
        avatar_url: null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getProfile = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, address, profession, dietary_preference, bio, avatar_url, avatar_public_id, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    next(error);
  }
};

// Update user profile information
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, profession, dietary_preference, bio } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const pool = getPool();
    await pool.query(
      `UPDATE users SET name = ?, phone = ?, address = ?, profession = ?, dietary_preference = ?, bio = ? WHERE id = ?`,
      [
        name,
        phone || '',
        address || '',
        profession || '',
        dietary_preference || 'Non-Veg',
        bio || '',
        userId
      ]
    );

    const [updatedRows] = await pool.query(
      'SELECT id, name, email, role, phone, address, profession, dietary_preference, bio, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Upload / Update user profile photo (Cloudinary)
export const updateAvatar = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select an image file to upload" });
    }

    const pool = getPool();
    const [existingRows] = await pool.query('SELECT avatar_url, avatar_public_id FROM users WHERE id = ?', [userId]);

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const oldPublicId = existingRows[0].avatar_public_id;

    // Upload memory buffer to Cloudinary folder FastBite/avatars
    const uploadResult = await uploadBufferToCloudinary(
      req.file.buffer,
      'FastBite/avatars',
      `user_${userId}`
    );

    await pool.query(
      'UPDATE users SET avatar_url = ?, avatar_public_id = ? WHERE id = ?',
      [uploadResult.secure_url, uploadResult.public_id, userId]
    );

    // Delete old avatar from Cloudinary if existed
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    const [updatedRows] = await pool.query(
      'SELECT id, name, email, role, phone, address, profession, dietary_preference, bio, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: "Profile photo updated successfully!",
      user: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Remove user profile photo
export const removeAvatar = async (req, res, next) => {
  try {
    const userId = req.userId;
    const pool = getPool();

    const [existingRows] = await pool.query('SELECT avatar_public_id FROM users WHERE id = ?', [userId]);

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const publicId = existingRows[0].avatar_public_id;
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    await pool.query('UPDATE users SET avatar_url = NULL, avatar_public_id = NULL WHERE id = ?', [userId]);

    const [updatedRows] = await pool.query(
      'SELECT id, name, email, role, phone, address, profession, dietary_preference, bio, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: "Profile photo removed successfully!",
      user: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};
