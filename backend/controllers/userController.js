import { getPool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
      return res.status(404).json({ success: false, message: "User does not exist" });
    }

    const user = rows[0];
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
        email: user.email
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

    // Insert user into database
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    const token = createToken(result.insertId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.insertId,
        name,
        email
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
      'SELECT id, name, email, phone, address, profession, dietary_preference, bio, created_at FROM users WHERE id = ?',
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
      'SELECT id, name, email, phone, address, profession, dietary_preference, bio, created_at FROM users WHERE id = ?',
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
