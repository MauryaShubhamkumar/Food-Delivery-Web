import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from './auth.repository.js';
import { normalizeRole, ROLE_PERMISSIONS } from '../../config/permissions.js';

const createToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing.");
  }
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

export const loginUserService = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Please provide email and password");
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 400;
    throw error;
  }

  if (user.is_active === false || user.is_active === 0) {
    const error = new Error("Your account has been deactivated. Please contact the administrator.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 400;
    throw error;
  }

  const token = createToken(user.id);
  const normRole = normalizeRole(user.role);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normRole,
      restaurant_id: user.restaurant_id || null,
      permissions: ROLE_PERMISSIONS[normRole] || [],
      avatar_url: user.avatar_url || null
    }
  };
};

export const registerUserService = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    const error = new Error("Please fill all required fields");
    error.statusCode = 400;
    throw error;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error("Please enter a valid email address");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("Password must be at least 6 characters long");
    error.statusCode = 400;
    throw error;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error("User already exists with this email");
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const targetRole = (role === 'restaurant_owner' || role === 'partner') ? 'restaurant_owner' : 'customer';

  const newUserId = await createUser({ name, email, hashedPassword, role: targetRole });
  const token = createToken(newUserId);

  return {
    token,
    user: {
      id: newUserId,
      name,
      email,
      role: targetRole,
      restaurant_id: null,
      permissions: ROLE_PERMISSIONS[targetRole] || [],
      avatar_url: null
    }
  };
};
