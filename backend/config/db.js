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
        role VARCHAR(20) DEFAULT 'customer',
        is_active BOOLEAN DEFAULT TRUE,
        phone VARCHAR(50),
        address TEXT,
        profession VARCHAR(255),
        dietary_preference VARCHAR(100) DEFAULT 'Non-Veg',
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
        category_id INT,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        coupon_code VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        payment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

    const createCouponsTable = `
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
        maximum_discount DECIMAL(10, 2) DEFAULT NULL,
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        expires_at DATETIME DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS restaurant_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_name VARCHAR(255) DEFAULT 'FastBite',
        logo_url TEXT,
        description TEXT,
        phone VARCHAR(50) DEFAULT '+91 6387252549',
        email VARCHAR(255) DEFAULT 'shubhamkumarmaurya155@gmail.com',
        address TEXT,
        opening_time VARCHAR(20) DEFAULT '10:00',
        closing_time VARCHAR(20) DEFAULT '22:00',
        is_open BOOLEAN DEFAULT TRUE,
        delivery_fee DECIMAL(10, 2) DEFAULT 40.00,
        minimum_order_amount DECIMAL(10, 2) DEFAULT 199.00,
        currency VARCHAR(10) DEFAULT 'INR',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTable);

    // Safely add missing columns to users, food_items, categories, restaurant_settings & orders tables if already created
    const alterQueries = [
      "ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'customer';",
      "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;",
      "ALTER TABLE users ADD COLUMN phone VARCHAR(50);",
      "ALTER TABLE users ADD COLUMN address TEXT;",
      "ALTER TABLE users ADD COLUMN profession VARCHAR(255);",
      "ALTER TABLE users ADD COLUMN dietary_preference VARCHAR(100) DEFAULT 'Non-Veg';",
      "ALTER TABLE users ADD COLUMN bio TEXT;",
      "ALTER TABLE users ADD COLUMN avatar_url TEXT;",
      "ALTER TABLE users ADD COLUMN avatar_public_id VARCHAR(255);",
      "ALTER TABLE food_items ADD COLUMN available BOOLEAN DEFAULT TRUE;",
      "ALTER TABLE food_items ADD COLUMN category_id INT;",
      "ALTER TABLE food_items ADD COLUMN cloudinary_public_id VARCHAR(255);",
      "ALTER TABLE food_items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;",
      "ALTER TABLE categories ADD COLUMN cloudinary_public_id VARCHAR(255);",
      "ALTER TABLE restaurant_settings ADD COLUMN logo_public_id VARCHAR(255);",
      "ALTER TABLE restaurant_settings ADD COLUMN upi_id VARCHAR(255) DEFAULT 'shubhamkumarmaurya155@okaxis';",
      "ALTER TABLE restaurant_settings ADD COLUMN upi_qr_url TEXT;",
      "ALTER TABLE restaurant_settings ADD COLUMN upi_qr_public_id VARCHAR(255);",
      "ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(100);",
      "ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cod';",
      "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'pending';",
      "ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);",
      "ALTER TABLE orders ADD COLUMN payment_verified_at TIMESTAMP NULL;",
      "ALTER TABLE orders ADD COLUMN payment_verified_by INT NULL;",
      "ALTER TABLE orders ADD COLUMN payment_rejection_reason TEXT;",
      "ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"
    ];

    for (const q of alterQueries) {
      try {
        await pool.query(q);
      } catch (colErr) {
        // Ignore column already exists errors
      }
    }

    await pool.query(createCategoriesTable);
    await pool.query(createFoodItemsTable);
    await pool.query(createCartItemsTable);
    await pool.query(createOrdersTable);
    await pool.query(createOrderItemsTable);
    await pool.query(createCouponsTable);
    await pool.query(createSettingsTable);

    // Create high-performance database indexes for search, filters & joins
    const indexQueries = [
      "CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);",
      "CREATE INDEX idx_orders_status ON orders (status);",
      "CREATE INDEX idx_orders_payment_status ON orders (payment_status);",
      "CREATE INDEX idx_orders_created_at ON orders (created_at);",
      "CREATE INDEX idx_orders_payment_ref ON orders (payment_reference);",
      "CREATE INDEX idx_food_items_avail_cat ON food_items (available, category_id);",
      "CREATE INDEX idx_food_items_category ON food_items (category);",
      "CREATE INDEX idx_order_items_order_id ON order_items (order_id);",
      "CREATE INDEX idx_order_items_food_id ON order_items (food_id);",
      "CREATE INDEX idx_users_role_created ON users (role, created_at);"
    ];

    for (const idxQuery of indexQueries) {
      try {
        await pool.query(idxQuery);
      } catch (idxErr) {
        // Ignore if index already exists
      }
    }

    // Auto-seed default restaurant settings if table is empty
    const [settingsRows] = await pool.query('SELECT id FROM restaurant_settings LIMIT 1');
    if (settingsRows.length === 0) {
      await pool.query(`
        INSERT INTO restaurant_settings (
          restaurant_name, description, phone, email, address, opening_time, closing_time, is_open, delivery_fee, minimum_order_amount, currency, is_active
        ) VALUES (
          'FastBite',
          'Delivering your favourite meals hot & fresh right to your doorstep. Experience premium dining at home with fast delivery and unmatched convenience.',
          '+91-6387252549',
          'shubhamkumarmaurya155@gmail.com',
          'Varanasi, Uttar Pradesh, India',
          '10:00',
          '22:00',
          TRUE,
          40.00,
          199.00,
          'INR',
          TRUE
        )
      `);
    }

    // Auto-seed default categories if categories table is empty
    const defaultCategories = [
      { name: "Salad", description: "Fresh and healthy green garden salads" },
      { name: "Rolls", description: "Delicious hot wrapped savory rolls" },
      { name: "Deserts", description: "Sweet delights, gelato, and ice creams" },
      { name: "Sandwich", description: "Gourmet toasted & grilled sandwiches" },
      { name: "Cake", description: "Freshly baked cakes and sweet pastries" },
      { name: "Pure Veg", description: "100% vegetarian culinary specialties" },
      { name: "Pasta", description: "Authentic Italian pastas & sauces" },
      { name: "Noodles", description: "Wok-tossed Hakka & Asian noodles" },
      { name: "Pizza", description: "Wood-fired crispy pizzas" },
      { name: "Burger", description: "Juicy smashed & crispy chicken burgers" },
      { name: "Sushi", description: "Fresh Japanese sushi rolls & sashimi" },
      { name: "Biryani", description: "Aromatic dum biryanis with spices" }
    ];

    for (const cat of defaultCategories) {
      const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [cat.name]);
      if (existing.length === 0) {
        await pool.query('INSERT INTO categories (name, description, is_active) VALUES (?, ?, TRUE)', [cat.name, cat.description]);
      }
    }

    // Auto-seed default coupons if coupons table is empty
    const defaultCoupons = [
      { code: 'FAST20', discount_type: 'percentage', discount_value: 20, minimum_order_amount: 500, maximum_discount: 200, usage_limit: 100 },
      { code: 'WELCOME100', discount_type: 'fixed', discount_value: 100, minimum_order_amount: 300, maximum_discount: null, usage_limit: 500 },
      { code: 'FLAT50', discount_type: 'fixed', discount_value: 50, minimum_order_amount: 250, maximum_discount: null, usage_limit: 200 }
    ];

    for (const c of defaultCoupons) {
      const [existing] = await pool.query('SELECT id FROM coupons WHERE code = ?', [c.code]);
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO coupons (code, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
          [c.code, c.discount_type, c.discount_value, c.minimum_order_amount, c.maximum_discount, c.usage_limit]
        );
      }
    }

    // Link food_items.category_id based on category string
    try {
      await pool.query('UPDATE food_items f JOIN categories c ON f.category = c.name SET f.category_id = c.id WHERE f.category_id IS NULL');
    } catch (linkErr) {
      // Ignore link error if already linked
    }

    console.log(" MySQL Database Tables, Categories & Coupons initialized successfully.");
  } catch (error) {
    console.error(" Table Initialization Error:", error.message);
  }
};

export const getPool = () => pool;
