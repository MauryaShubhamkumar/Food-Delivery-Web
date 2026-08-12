import { getPool } from '../../config/db.js';

export const findUserByEmail = async (email) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

export const createUser = async ({ name, email, hashedPassword, role }) => {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, role]
  );
  return result.insertId;
};
