import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'food_del';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

const useSSL = process.env.DB_SSL === 'true' || DB_HOST.includes('tidbcloud.com') || DB_HOST.includes('aws') || DB_HOST.includes('azure');
const sslConfig = useSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;

let pool;

export const connectDB = async () => {
  try {
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
      // Ignore database creation error if already exists or restricted
    }

    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      ssl: sslConfig,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });

    const connection = await pool.getConnection();
    connection.release();

    console.log(`MySQL Database Pool connected to '${DB_NAME}' on ${DB_HOST}${useSSL ? ' (SSL Secured)' : ''}`);

    await initTables();
  } catch (error) {
    console.error(`MySQL Connection Error: ${error.message}`);
    console.log(`Check your .env host, port, user, password, and DB_SSL settings.`);
  }
};

const initTables = async () => {
  try {
    const createRestaurantsTable = `
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        logo_url TEXT,
        logo_public_id VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        status VARCHAR(20) DEFAULT 'setup',
        onboarding_step INT DEFAULT 1,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        restaurant_id INT NULL,
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
        restaurant_id INT DEFAULT 1,
        name VARCHAR(255) NOT NULL,
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
        restaurant_id INT DEFAULT 1,
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
        restaurant_id INT DEFAULT 1,
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
        restaurant_id INT DEFAULT 1,
        code VARCHAR(100) NOT NULL,
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
        restaurant_id INT DEFAULT 1,
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

    await pool.query(createRestaurantsTable);
    await pool.query(createUsersTable);

    const [initialRestRows] = await pool.query('SELECT id FROM restaurants WHERE id = 1');
    if (initialRestRows.length === 0) {
      await pool.query(`
        INSERT INTO restaurants (id, name, slug, email, phone, address, status)
        VALUES (1, 'FastBite', 'fastbite', 'shubhamkumarmaurya155@gmail.com', '+91-6387252549', 'Varanasi, Uttar Pradesh, India', 'active')
      `);
    }

    const alterQueries = [
      "ALTER TABLE users ADD COLUMN restaurant_id INT NULL;",
      "ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'customer';",
      "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;",
      "ALTER TABLE users ADD COLUMN phone VARCHAR(50);",
      "ALTER TABLE users ADD COLUMN address TEXT;",
      "ALTER TABLE users ADD COLUMN profession VARCHAR(255);",
      "ALTER TABLE users ADD COLUMN dietary_preference VARCHAR(100) DEFAULT 'Non-Veg';",
      "ALTER TABLE users ADD COLUMN bio TEXT;",
      "ALTER TABLE users ADD COLUMN avatar_url TEXT;",
      "ALTER TABLE users ADD COLUMN avatar_public_id VARCHAR(255);",
      "ALTER TABLE food_items ADD COLUMN restaurant_id INT DEFAULT 1;",
      "ALTER TABLE food_items ADD COLUMN available BOOLEAN DEFAULT TRUE;",
      "ALTER TABLE food_items ADD COLUMN category_id INT;",
      "ALTER TABLE food_items ADD COLUMN cloudinary_public_id VARCHAR(255);",
      "ALTER TABLE food_items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;",
      "ALTER TABLE categories ADD COLUMN restaurant_id INT DEFAULT 1;",
      "ALTER TABLE categories ADD COLUMN cloudinary_public_id VARCHAR(255);",
      "ALTER TABLE restaurant_settings ADD COLUMN restaurant_id INT DEFAULT 1;",
      "ALTER TABLE restaurant_settings ADD COLUMN logo_public_id VARCHAR(255);",
      "ALTER TABLE restaurant_settings ADD COLUMN upi_id VARCHAR(255) DEFAULT 'shubhamkumarmaurya155@okaxis';",
      "ALTER TABLE restaurant_settings ADD COLUMN upi_qr_url TEXT;",
      "ALTER TABLE restaurant_settings ADD COLUMN upi_qr_public_id VARCHAR(255);",
      "ALTER TABLE orders ADD COLUMN restaurant_id INT DEFAULT 1;",
      "ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(100);",
      "ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;",
      "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cod';",
      "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'pending';",
      "ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);",
      "ALTER TABLE orders ADD COLUMN payment_verified_at TIMESTAMP NULL;",
      "ALTER TABLE orders ADD COLUMN payment_verified_by INT NULL;",
      "ALTER TABLE orders ADD COLUMN payment_rejection_reason TEXT;",
      "ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;",
      "ALTER TABLE coupons ADD COLUMN restaurant_id INT DEFAULT 1;",
      "ALTER TABLE reviews ADD COLUMN restaurant_id INT DEFAULT 1;",
      "ALTER TABLE reviews ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;",
      "ALTER TABLE reviews ADD COLUMN food_id INT;",
      "ALTER TABLE restaurants ADD COLUMN city VARCHAR(100);",
      "ALTER TABLE restaurants ADD COLUMN state VARCHAR(100);",
      "ALTER TABLE restaurants ADD COLUMN pincode VARCHAR(20);",
      "ALTER TABLE restaurants ADD COLUMN onboarding_step INT DEFAULT 1;",
      "ALTER TABLE restaurants ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;",
      "ALTER TABLE restaurants ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 5.00;"
    ];

    for (const q of alterQueries) {
      try {
        await pool.query(q);
      } catch (colErr) {}
    }

    const backfillQueries = [
      "UPDATE categories SET restaurant_id = 1 WHERE restaurant_id IS NULL;",
      "UPDATE food_items SET restaurant_id = 1 WHERE restaurant_id IS NULL;",
      "UPDATE orders SET restaurant_id = 1 WHERE restaurant_id IS NULL;",
      "UPDATE coupons SET restaurant_id = 1 WHERE restaurant_id IS NULL;",
      "UPDATE restaurant_settings SET restaurant_id = 1 WHERE restaurant_id IS NULL;",
      "UPDATE reviews SET is_visible = TRUE WHERE is_visible IS NULL;",
      "UPDATE reviews SET food_id = product_id WHERE food_id IS NULL AND product_id IS NOT NULL;",
      "UPDATE users SET role = 'restaurant_owner' WHERE LOWER(role) = 'admin';",
      "UPDATE users SET role = 'customer' WHERE LOWER(role) = 'user' OR role IS NULL;",
      "UPDATE users SET restaurant_id = 1 WHERE (role = 'restaurant_owner' OR role = 'manager' OR role = 'kitchen_staff') AND restaurant_id IS NULL;",
      "UPDATE restaurants SET status = 'active', onboarding_step = 6, onboarding_completed = TRUE WHERE id = 1 AND (onboarding_completed IS NULL OR onboarding_completed = FALSE);"
    ];

    for (const bq of backfillQueries) {
      try {
        await pool.query(bq);
      } catch (bkErr) {}
    }

    try {
      const [saRows] = await pool.query("SELECT id FROM users WHERE role = 'super_admin'");
      if (saRows.length === 0) {
        const bcrypt = (await import('bcrypt')).default;
        const saPassword = await bcrypt.hash('SuperAdmin@123', 10);
        await pool.query(
          "INSERT INTO users (name, email, password, role) VALUES ('FastBite Super Admin', 'superadmin@fastbite.com', ?, 'super_admin')",
          [saPassword]
        );
        console.log("Super Admin account initialized: superadmin@fastbite.com / SuperAdmin@123");
      }
    } catch (saErr) {}

    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT DEFAULT 1,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        food_id INT NULL,
        order_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        status VARCHAR(20) DEFAULT 'visible',
        is_visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_order_product (user_id, order_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES food_items(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `;

    const createInventoryTable = `
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL UNIQUE,
        restaurant_id INT NOT NULL DEFAULT 1,
        quantity INT NOT NULL DEFAULT 50,
        minimum_stock INT NOT NULL DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES food_items(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      );
    `;

    const createInventoryTransactionsTable = `
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT NOT NULL,
        product_id INT NOT NULL,
        restaurant_id INT NOT NULL DEFAULT 1,
        type VARCHAR(30) NOT NULL,
        quantity INT NOT NULL,
        previous_quantity INT NOT NULL,
        new_quantity INT NOT NULL,
        reason VARCHAR(255) NULL,
        order_id INT NULL,
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES food_items(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      );
    `;

    const createAuditLogsTable = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NULL,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NULL,
        details TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_tenant (restaurant_id, created_at DESC),
        INDEX idx_audit_user (user_id, created_at DESC)
      );
    `;

    await pool.query(createCategoriesTable);
    await pool.query(createFoodItemsTable);
    await pool.query(createCartItemsTable);
    await pool.query(createOrdersTable);
    await pool.query(createOrderItemsTable);
    await pool.query(createCouponsTable);
    await pool.query(createSettingsTable);
    await pool.query(createReviewsTable);
    await pool.query(createInventoryTable);
    await pool.query(createInventoryTransactionsTable);
    await pool.query(createAuditLogsTable);

    try {
      await pool.query(`
        INSERT IGNORE INTO inventory (product_id, restaurant_id, quantity, minimum_stock)
        SELECT id, COALESCE(restaurant_id, 1), 50, 5 FROM food_items;
      `);
    } catch (invBqErr) {}

    try { await pool.query('ALTER TABLE categories DROP INDEX name;'); } catch (e) {}
    try { await pool.query('ALTER TABLE categories ADD UNIQUE KEY unique_tenant_category (restaurant_id, name);'); } catch (e) {}

    try { await pool.query('ALTER TABLE coupons DROP INDEX code;'); } catch (e) {}
    try { await pool.query('ALTER TABLE coupons ADD UNIQUE KEY unique_tenant_coupon (restaurant_id, code);'); } catch (e) {}

    try { await pool.query('ALTER TABLE restaurant_settings ADD UNIQUE KEY unique_tenant_settings (restaurant_id);'); } catch (e) {}

    const indexQueries = [
      "CREATE INDEX idx_food_items_tenant ON food_items (restaurant_id, available);",
      "CREATE INDEX idx_orders_tenant ON orders (restaurant_id, created_at DESC);",
      "CREATE INDEX idx_categories_tenant ON categories (restaurant_id);",
      "CREATE INDEX idx_coupons_tenant ON coupons (restaurant_id);",
      "CREATE INDEX idx_reviews_tenant ON reviews (restaurant_id);",
      "CREATE INDEX idx_inventory_tenant ON inventory (restaurant_id, quantity);",
      "CREATE INDEX idx_inv_tx_tenant ON inventory_transactions (restaurant_id, created_at DESC);",
      "CREATE INDEX idx_users_tenant ON users (restaurant_id, role);",
      "CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);",
      "CREATE INDEX idx_orders_status ON orders (status);",
      "CREATE INDEX idx_orders_payment_status ON orders (payment_status);",
      "CREATE INDEX idx_orders_created_at ON orders (created_at);",
      "CREATE INDEX idx_orders_payment_ref ON orders (payment_reference);",
      "CREATE INDEX idx_food_items_avail_cat ON food_items (available, category_id);",
      "CREATE INDEX idx_food_items_category ON food_items (category);",
      "CREATE INDEX idx_order_items_order_id ON order_items (order_id);",
      "CREATE INDEX idx_order_items_food_id ON order_items (food_id);",
      "CREATE INDEX idx_users_role_created ON users (role, created_at);",
      "CREATE INDEX idx_reviews_prod_status ON reviews (product_id, status);",
      "CREATE INDEX idx_reviews_status_created ON reviews (status, created_at DESC);"
    ];

    for (const idxQuery of indexQueries) {
      try {
        await pool.query(idxQuery);
      } catch (idxErr) {}
    }

    const [settingsRows] = await pool.query('SELECT id FROM restaurant_settings WHERE restaurant_id = 1 LIMIT 1');
    if (settingsRows.length === 0) {
      await pool.query(`
        INSERT INTO restaurant_settings (
          restaurant_id, restaurant_name, description, phone, email, address, opening_time, closing_time, is_open, delivery_fee, minimum_order_amount, currency, is_active
        ) VALUES (
          1,
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
      const [existing] = await pool.query('SELECT id FROM categories WHERE restaurant_id = 1 AND name = ?', [cat.name]);
      if (existing.length === 0) {
        await pool.query('INSERT INTO categories (restaurant_id, name, description, is_active) VALUES (1, ?, ?, TRUE)', [cat.name, cat.description]);
      }
    }

    const defaultCoupons = [
      { code: 'FAST20', discount_type: 'percentage', discount_value: 20, minimum_order_amount: 500, maximum_discount: 200, usage_limit: 100 },
      { code: 'WELCOME100', discount_type: 'fixed', discount_value: 100, minimum_order_amount: 300, maximum_discount: null, usage_limit: 500 },
      { code: 'FLAT50', discount_type: 'fixed', discount_value: 50, minimum_order_amount: 250, maximum_discount: null, usage_limit: 200 }
    ];

    for (const c of defaultCoupons) {
      const [existing] = await pool.query('SELECT id FROM coupons WHERE restaurant_id = 1 AND code = ?', [c.code]);
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO coupons (restaurant_id, code, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, is_active) VALUES (1, ?, ?, ?, ?, ?, ?, TRUE)',
          [c.code, c.discount_type, c.discount_value, c.minimum_order_amount, c.maximum_discount, c.usage_limit]
        );
      }
    }

    try {
      await pool.query('UPDATE food_items f JOIN categories c ON f.category = c.name SET f.category_id = c.id WHERE f.category_id IS NULL');
    } catch (linkErr) {}

    console.log(" MySQL Database Tables, Categories & Coupons initialized successfully.");
  } catch (error) {
    console.error(" Table Initialization Error:", error.message);
  }
};

export const getPool = () => pool;

export const querySafe = async (sql, params = []) => {
  if (!pool) throw new Error("Database connection pool is not initialized.");
  try {
    return await pool.query(sql, params);
  } catch (err) {
    const isConnErr =
      err.code === 'ECONNRESET' ||
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'EPIPE' ||
      err.code === 'ER_CON_COUNT_ERROR' ||
      (err.message && (err.message.includes('ECONNRESET') || err.message.includes('read ECONNRESET')));

    if (isConnErr) {
      console.warn(`[MySQL Resilient Query] Connection reset detected (${err.code || err.message}). Retrying query...`);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return await pool.query(sql, params);
    }
    throw err;
  }
};
