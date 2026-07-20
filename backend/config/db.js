import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'food_del';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

// Auto-detect or force SSL for cloud MySQL instances (e.g., TiDB Cloud)
const useSSL = process.env.DB_SSL === 'true' || DB_HOST.includes('tidbcloud.com') || DB_HOST.includes('aws') || DB_HOST.includes('azure');
const sslConfig = useSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;

let pool;

export const connectDB = async () => {
  try {
    // 1. Attempt database creation if local/standard server
    try {
      const initConnection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: sslConfig
      });

      await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
      await initConnection.end();
    } catch (createDbErr) {
      // Ignore database creation error if database is already created or user scoped to database
    }

    // 2. Initialize connection pool targeting target database
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      ssl: sslConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test pool connection
    const connection = await pool.getConnection();
    connection.release();

    console.log(`MySQL Database Pool connected to '${DB_NAME}' on ${DB_HOST}${useSSL ? ' (SSL Secured)' : ''}`);

    // 3. Initialize required database tables
    await initTables();
  } catch (error) {
    console.error(`MySQL Connection Error: ${error.message}`);
    console.log(`Check your .env host, port, user, password, and DB_SSL settings.`);
  }
};


const initTables = async () => {
  try {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        profession VARCHAR(255),
        dietary_preference VARCHAR(100) DEFAULT 'Non-Veg',
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createFoodItemsTable = `
      CREATE TABLE IF NOT EXISTS food_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500) NOT NULL,
        category VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCartItemsTable = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        food_id INT NOT NULL,
        quantity INT DEFAULT 1,
        UNIQUE KEY user_food_unique (user_id, food_id)
      );
    `;

    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255),
        street VARCHAR(255),
        city VARCHAR(255),
        state VARCHAR(255),
        zip_code VARCHAR(50),
        country VARCHAR(100),
        phone VARCHAR(50),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Food Processing',
        payment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        food_id INT NOT NULL,
        name VARCHAR(255),
        price DECIMAL(10, 2),
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `;

    await pool.query(createUsersTable);

    // Safely add missing columns to users table if already created
    const alterQueries = [
      "ALTER TABLE users ADD COLUMN phone VARCHAR(50);",
      "ALTER TABLE users ADD COLUMN address TEXT;",
      "ALTER TABLE users ADD COLUMN profession VARCHAR(255);",
      "ALTER TABLE users ADD COLUMN dietary_preference VARCHAR(100) DEFAULT 'Non-Veg';",
      "ALTER TABLE users ADD COLUMN bio TEXT;"
    ];

    for (const q of alterQueries) {
      try {
        await pool.query(q);
      } catch (colErr) {
        // Ignore column already exists errors
      }
    }

    await pool.query(createFoodItemsTable);
    await pool.query(createCartItemsTable);
    await pool.query(createOrdersTable);
    await pool.query(createOrderItemsTable);

    console.log(" MySQL Database Tables initialized successfully.");
  } catch (error) {
    console.error(" Table Initialization Error:", error.message);
  }
};

export const getPool = () => pool;
