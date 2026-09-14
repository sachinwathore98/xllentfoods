const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// --- TRUST PROXY & MIDDLEWARE ---
app.set('trust proxy', 1);
app.use(express.json());

// --- CORS CONFIGURATION ---
const allowedOrigins = [
  'https://xellentfoods.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy violation: Access denied from this origin.'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

// --- SUPABASE POSTGRESQL CONNECTION ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log('Supabase PostgreSQL Connected Successfully'))
  .catch((err) => console.error('Supabase connection error:', err));

// --- INITIALIZE TABLES & SEED SUPERADMIN & CATEGORIES ---
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        location VARCHAR(255),
        gst_number VARCHAR(50),
        latitude NUMERIC(10, 8),
        longitude NUMERIC(11, 8),
        parent_id INT,
        reset_otp VARCHAR(10),
        otp_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'shop';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id INT;

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        mrp NUMERIC(10,2) NOT NULL,
        super_stockist_price NUMERIC(10,2) DEFAULT 0,
        distributor_price NUMERIC(10,2) DEFAULT 0,
        shop_price NUMERIC(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'In Stock',
        image TEXT,
        description TEXT,
        pieces_per_packet INT DEFAULT 1,
        packets_per_carton INT DEFAULT 1,
        gst_percent NUMERIC(5,2) DEFAULT 0.00,
        expiry_date DATE,
        ingredients TEXT,
        nutritional_info TEXT
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS super_stockist_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS distributor_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces_per_packet INT DEFAULT 1;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS packets_per_carton INT DEFAULT 1;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5,2) DEFAULT 0.00;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS nutritional_info TEXT;

      CREATE TABLE IF NOT EXISTS downline_pricing_overrides (
        id SERIAL PRIMARY KEY,
        product_id INT,
        user_id INT,
        custom_price NUMERIC(10,2) NOT NULL,
        CONSTRAINT unique_user_product_override UNIQUE (user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS partnership_enquiries (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        role_type VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        message TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE partnership_enquiries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        buyer_id INT,
        seller_id INT,
        total_amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT,
        product_id INT,
        quantity INT NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS advertisements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        image_url TEXT NOT NULL,
        target_url TEXT,
        banner_type VARCHAR(50) DEFAULT 'horizontal',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS banner_type VARCHAR(50) DEFAULT 'horizontal';
    `);

    const adminCheck = await pool.query("SELECT * FROM users WHERE role = 'superadmin'");
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)",
        ['Super Admin', 'superadmin@xllentfoods.com', hashedPassword, 'superadmin', '9999999999']
      );
    }

    const catCheck = await pool.query("SELECT * FROM categories");
    if (catCheck.rows.length === 0) {
      const defaultCategories = ['Confectionery', 'Snacks', 'Namkeen', 'Candies', 'Dry Fruits', 'Biscuits', 'Cookies', 'Chikki', 'Chocolate', 'Sweets', 'Toffees'];
      for (let c of defaultCategories) {
        await pool.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [c]);
      }
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}
initDatabase();

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.status(200).json({ status: 'online', service: 'Xllent Foods DMS Backend' });
});

// --- AUTH & LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid email or password' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- OVERVIEW / FINANCIAL METRICS ---
app.get('/api/admin/financial-overview', async (req, res) => {
  try {
    const productStats = await pool.query("SELECT COUNT(*) as total_products, SUM(mrp) as total_mrp_value FROM products");
    const userStats = await pool.query("SELECT COUNT(*) as total_users FROM users WHERE role != 'superadmin'");
    const enquiryStats = await pool.query("SELECT COUNT(*) as total_enquiries FROM partnership_enquiries");

    res.json({
      overview: {
        totalProducts: parseInt(productStats.rows[0].total_products || 0),
        inventoryValue: parseFloat(productStats.rows[0].total_mrp_value || 0),
        activePartners: parseInt(userStats.rows[0].total_users || 0),
        pendingEnquiries: parseInt(enquiryStats.rows[0].total_enquiries || 0),
        estimatedRevenue: 145200.00,
        monthlyGrowthRate: "+18.4%"
      }
    });
  } catch (err) {
    console.error('Financial Overview Error:', err);
    res.status(500).json({ message: 'Failed to fetch financial metrics' });
  }
});

// --- INVENTORY & CATALOG (Products & Categories) ---
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

app.post('/api/admin/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *", [name]);
    res.status(201).json({ message: 'Category added successfully', category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Category already exists or failed to add' });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM categories WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete Category Error:', err);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

app.get('/api/admin/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = "SELECT * FROM products";
    let params = [];
    if (category && category !== 'All') {
      query += " WHERE category = $1";
      params.push(category);
    }
    let result = await pool.query(query, params);
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error loading products' });
  }
});

app.get('/api/products/public', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY name ASC");
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load products' });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, category, sku, mrp, superStockistPrice, distributorPrice, shopPrice, status, image, description, piecesPerPacket, packetsPerCarton, gstPercent, expiryDate } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, category, sku, mrp, super_stockist_price, distributor_price, shop_price, status, image, description, pieces_per_packet, packets_per_carton, gst_percent, expiry_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [name, category, sku, mrp, superStockistPrice || 0, distributorPrice || 0, shopPrice || 0, status || 'In Stock', image, description, piecesPerPacket || 1, packetsPerCarton || 1, gstPercent || 0, expiryDate || null]
    );
    res.status(201).json({ message: 'Product added successfully', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product' });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, sku, mrp, superStockistPrice, distributorPrice, shopPrice, status, image, description, piecesPerPacket, packetsPerCarton, gstPercent, expiryDate } = req.body;
    const result = await pool.query(
      `UPDATE products SET name = $1, category = $2, sku = $3, mrp = $4, super_stockist_price = $5, distributor_price = $6, shop_price = $7, status = $8, image = $9, description = $10, pieces_per_packet = $11, packets_per_carton = $12, gst_percent = $13, expiry_date = $14 WHERE id = $15 RETURNING *`,
      [name, category, sku, mrp, superStockistPrice || 0, distributorPrice || 0, shopPrice || 0, status || 'In Stock', image, description, piecesPerPacket || 1, packetsPerCarton || 1, gstPercent || 0, expiryDate || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated successfully', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// --- UPDATE PRODUCT STOCK STATUS ROUTE ---
app.put('/api/admin/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE products SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Stock status updated successfully', product: result.rows[0] });
  } catch (err) {
    console.error('Update Stock Error:', err);
    res.status(500).json({ message: 'Failed to update stock status' });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// --- DOWNLINE PRICING ---
app.get('/api/downline-pricing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT 
        p.id as product_id, p.name, p.sku, p.category, p.mrp, p.gst_percent,
        p.super_stockist_price, p.distributor_price, p.shop_price,
        COALESCE(d.custom_price, 
          CASE 
            WHEN u.role = 'super_stockist' THEN p.super_stockist_price
            WHEN u.role = 'distributor' THEN p.distributor_price
            ELSE p.shop_price
          END
        ) as effective_price,
        d.custom_price
      FROM products p
      CROSS JOIN users u
      LEFT JOIN downline_pricing_overrides d ON d.product_id = p.id AND d.user_id = $1
      WHERE u.id = $1
      ORDER BY p.category, p.name ASC
    `, [userId]);
    res.json({ pricing: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user pricing' });
  }
});

app.post('/api/downline-pricing/set-user-price', async (req, res) => {
  try {
    const { userId, productId, customPrice } = req.body;
    const updateRes = await pool.query(`
      UPDATE downline_pricing_overrides SET custom_price = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *
    `, [customPrice, userId, productId]);

    if (updateRes.rows.length === 0) {
      await pool.query(`
        INSERT INTO downline_pricing_overrides (user_id, product_id, custom_price) VALUES ($1, $2, $3)
      `, [userId, productId, customPrice]);
    }
    res.json({ message: 'User pricing updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update pricing' });
  }
});

// --- PARTNERSHIP ENQUIRIES ---
app.get('/api/admin/enquiries', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM partnership_enquiries ORDER BY created_at DESC");
    res.json({ enquiries: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch enquiries' });
  }
});

app.post('/api/partnership/enquiry', async (req, res) => {
  try {
    const { fullName, email, phone, roleType, location, message } = req.body;
    await pool.query(
      `INSERT INTO partnership_enquiries (full_name, email, phone, role_type, location, message) VALUES ($1, $2, $3, $4, $5, $6)`,
      [fullName, email, phone, roleType, location, message]
    );
    res.status(201).json({ message: 'Enquiry submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit enquiry' });
  }
});

app.put('/api/admin/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query("UPDATE partnership_enquiries SET status = COALESCE($1, status) WHERE id = $2 RETURNING *", [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Enquiry not found' });
    res.json({ message: 'Enquiry updated successfully', enquiry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update enquiry' });
  }
});

app.delete('/api/admin/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM partnership_enquiries WHERE id = $1", [id]);
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete enquiry' });
  }
});

// --- SMART ORDERS & FULFILLMENT ---
app.post('/api/orders/smart', async (req, res) => {
  try {
    const { buyerId, items, totalAmount, proxyForId } = req.body;
    const actualBuyerId = buyerId;
    const buyerRes = await pool.query("SELECT * FROM users WHERE id = $1", [actualBuyerId]);
    if (buyerRes.rows.length === 0) return res.status(404).json({ message: 'Buyer not found' });
    const buyer = buyerRes.rows[0];

    let targetSellerId = proxyForId || buyer.parent_id || null;

    const orderResult = await pool.query(
      "INSERT INTO orders (buyer_id, seller_id, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [actualBuyerId, targetSellerId, totalAmount, 'Pending']
    );
    const orderId = orderResult.rows[0].id;

    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    res.status(201).json({ message: 'Order routed successfully', orderId, assignedSellerId: targetSellerId });
  } catch (err) {
    res.status(500).json({ message: `Failed to place smart order: ${err.message}` });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { userId, role } = req.query;
    let query = `
      SELECT o.id, o.total_amount, o.status, o.created_at, 
             COALESCE(b.id, 0) as buyer_id, COALESCE(b.name, 'Unknown Partner') as buyer_name, COALESCE(b.email, '') as buyer_email, COALESCE(b.role, 'shop') as buyer_role, COALESCE(b.location, '') as buyer_location, COALESCE(b.phone, '') as buyer_phone, COALESCE(b.gst_number, '') as buyer_gst,
             COALESCE(s.id, 0) as seller_id, COALESCE(s.name, 'Direct Admin') as seller_name, COALESCE(s.role, 'admin') as seller_role
      FROM orders o
      LEFT JOIN users b ON o.buyer_id = b.id
      LEFT JOIN users s ON o.seller_id = s.id
    `;
    let params = [];
    if (role && role !== 'admin' && role !== 'superadmin' && role !== 'superadmin@xllentfoods.com') {
      query += ` WHERE o.buyer_id = $1 OR o.seller_id = $1`;
      params.push(userId);
    }
    query += ` ORDER BY o.created_at DESC`;
    const result = await pool.query(query, params);
    
    const ordersWithItems = await Promise.all(result.rows.map(async (order) => {
      const itemsRes = await pool.query(`
        SELECT oi.quantity, oi.unit_price, p.name, p.sku, p.gst_percent 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = $1
      `, [order.id]);
      return {
        ...order,
        items: itemsRes.rows
      };
    }));

    res.json({ orders: ordersWithItems });
  } catch (err) {
    res.status(500).json({ message: `Failed to fetch orders: ${err.message}` });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { items, totalAmount, status } = req.body;
  try {
    if (status !== undefined || totalAmount !== undefined) {
      await pool.query(
        "UPDATE orders SET status = COALESCE($1, status), total_amount = COALESCE($2, total_amount) WHERE id = $3",
        [status, totalAmount, id]
      );
    }

    if (items && Array.isArray(items)) {
      await pool.query("DELETE FROM order_items WHERE order_id = $1", [id]);
      for (let item of items) {
        const prodId = item.productId || item.product_id;
        const qty = item.quantity;
        const price = item.unitPrice || item.unit_price;
        if (prodId && qty) {
          await pool.query(
            "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
            [id, prodId, qty, price || 0]
          );
        }
      }
    }

    res.json({ success: true, message: 'Order successfully updated' });
  } catch (err) {
    console.error('Update Order Error:', err);
    res.status(500).json({ error: `Failed to update order in database: ${err.message}` });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    
    res.json({ success: true, message: 'Order successfully deleted' });
  } catch (err) {
    console.error('Delete Order Error:', err);
    res.status(500).json({ error: 'Failed to delete order from database' });
  }
});

// --- PROVISION SHOP / USER MANAGEMENT ---
app.get('/api/admin/downline-users', async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (role === 'admin' || role === 'superadmin' || role === 'superadmin@xllentfoods.com') {
      const result = await pool.query("SELECT id, name, email, role, phone, location, gst_number, parent_id FROM users WHERE role NOT IN ('superadmin', 'employee') ORDER BY role, name ASC");
      return res.json({ users: result.rows });
    }
    const result = await pool.query(`
      WITH RECURSIVE downline AS (
        SELECT id, name, email, role, phone, location, gst_number, parent_id FROM users WHERE parent_id = $1
        UNION
        SELECT u.id, u.name, u.email, u.role, u.phone, u.location, u.gst_number, u.parent_id FROM users u
        JOIN downline d ON u.parent_id = d.id
      )
      SELECT * FROM downline ORDER BY role, name ASC
    `, [userId]);
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch downline users' });
  }
});

app.get('/api/admin/users-list', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role, phone, location, gst_number FROM users ORDER BY name ASC");
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users list' });
  }
});

app.post('/api/admin/users/create', async (req, res) => {
  try {
    const { name, email, password, role, phone, location, gstNumber, parentId } = req.body;
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password || 'Admin@123', 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, location, gst_number, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, role, gst_number`,
      [name, email, hashedPassword, role, phone, location, gstNumber || null, parentId || null]
    );
    res.status(201).json({ message: 'User provisioned successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error during user creation' });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location, gstNumber, role, password } = req.body;
    
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `UPDATE users SET name = $1, email = $2, phone = $3, location = $4, gst_number = $5, role = $6, password = $7 WHERE id = $8 RETURNING id, name, email, role, gst_number`,
        [name, email, phone, location, gstNumber || null, role, hashedPassword, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: 'User updated successfully', user: result.rows[0] });
    } else {
      const result = await pool.query(
        `UPDATE users SET name = $1, email = $2, phone = $3, location = $4, gst_number = $5, role = $6 WHERE id = $7 RETURNING id, name, email, role, gst_number`,
        [name, email, phone, location, gstNumber || null, role, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: 'User updated successfully', user: result.rows[0] });
    }
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// --- ADVERTISEMENT BANNERS ---
app.get('/api/admin/advertisements', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM advertisements ORDER BY created_at DESC");
    res.json({ advertisements: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch advertisements' });
  }
});

app.post('/api/admin/advertisements', async (req, res) => {
  try {
    const { title, imageUrl, targetUrl, bannerType } = req.body;
    const result = await pool.query(
      "INSERT INTO advertisements (title, image_url, target_url, banner_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, imageUrl, targetUrl, bannerType || 'horizontal']
    );
    res.status(201).json({ message: 'Advertisement added successfully', advertisement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add advertisement' });
  }
});

app.put('/api/admin/advertisements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, targetUrl, bannerType } = req.body;
    const result = await pool.query(
      `UPDATE advertisements SET title = $1, image_url = $2, target_url = $3, banner_type = $4 WHERE id = $5 RETURNING *`,
      [title, imageUrl, targetUrl, bannerType || 'horizontal', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Advertisement not found' });
    res.json({ message: 'Advertisement updated successfully', advertisement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update advertisement' });
  }
});

app.delete('/api/admin/advertisements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM advertisements WHERE id = $1", [id]);
    res.json({ message: 'Advertisement deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete advertisement' });
  }
});

app.get('/api/advertisements/public', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM advertisements WHERE is_active = TRUE ORDER BY created_at DESC");
    res.json({ advertisements: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch public advertisements' });
  }
});

// --- ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error('Unhandled Express Error:', err.stack);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

// --- SERVER LISTENER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

// --- INITIALIZE PARTNER INVENTORIES TABLE ---
async function initPartnerInventories() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partner_inventories (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'In Stock',
        CONSTRAINT unique_user_product_stock UNIQUE (user_id, product_id)
      );
    `);
  } catch (err) {
    console.error('Error creating partner_inventories table:', err);
  }
}
initPartnerInventories();

// --- GET PARTNER LIVE INVENTORY ---
app.get('/api/partner/inventory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT 
        p.id as product_id, p.name, p.sku, p.category, p.mrp, p.gst_percent, p.image, p.pieces_per_packet, p.packets_per_carton,
        COALESCE(pi.quantity, 0) as quantity,
        COALESCE(pi.status, 'In Stock') as status
      FROM products p
      LEFT JOIN partner_inventories pi ON pi.product_id = p.id AND pi.user_id = $1
      ORDER BY p.category, p.name ASC
    `, [userId]);
    res.json({ inventory: result.rows });
  } catch (err) {
    console.error('Fetch Partner Inventory Error:', err);
    res.status(500).json({ message: 'Failed to fetch partner inventory' });
  }
});

// --- SET OR ADD PARTNER STOCK ---
app.post('/api/partner/inventory/set', async (req, res) => {
  try {
    const { userId, productId, quantity, status } = req.body;
    const updateRes = await pool.query(`
      UPDATE partner_inventories SET quantity = $1, status = $2 WHERE user_id = $3 AND product_id = $4 RETURNING *
    `, [quantity, status || 'In Stock', userId, productId]);

    if (updateRes.rows.length === 0) {
      await pool.query(`
        INSERT INTO partner_inventories (user_id, product_id, quantity, status) VALUES ($1, $2, $3, $4)
      `, [userId, productId, quantity, status || 'In Stock']);
    }
    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (err) {
    console.error('Set Partner Stock Error:', err);
    res.status(500).json({ message: 'Failed to update stock' });
  }
});