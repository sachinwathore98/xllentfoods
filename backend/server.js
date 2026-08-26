const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SibApiV3Sdk = require('@getbrevo/brevo');
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

// --- INITIALIZE TABLES & SEED SUPERADMIN & PRICING TIERS ---
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
        latitude NUMERIC(10, 8),
        longitude NUMERIC(11, 8),
        parent_id INT REFERENCES users(id),
        reset_otp VARCHAR(10),
        otp_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'shop';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
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
        status VARCHAR(50) DEFAULT 'In Stock',
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS product_pricing (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        role_target VARCHAR(50) NOT NULL,
        owner_id INT REFERENCES users(id),
        custom_price NUMERIC(10,2) NOT NULL,
        UNIQUE(product_id, role_target, owner_id)
      );

      CREATE TABLE IF NOT EXISTS partnership_enquiries (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        role_type VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        buyer_id INT REFERENCES users(id),
        seller_id INT REFERENCES users(id),
        total_amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id),
        quantity INT NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id SERIAL PRIMARY KEY,
        tier_key VARCHAR(50) UNIQUE NOT NULL,
        role_name VARCHAR(100) NOT NULL,
        description TEXT,
        base_discount NUMERIC(5,2) NOT NULL,
        min_order_value NUMERIC(12,2) NOT NULL,
        payment_terms VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default superadmin if not exists
    const adminCheck = await pool.query("SELECT * FROM users WHERE role = 'superadmin'");
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)",
        ['Super Admin', 'superadmin@xllentfoods.com', hashedPassword, 'superadmin', '9999999999']
      );
      console.log('Default SuperAdmin seeded: superadmin@xllentfoods.com / Admin@123');
    }

    // Seed default categories
    const catCheck = await pool.query("SELECT * FROM categories");
    if (catCheck.rows.length === 0) {
      const defaultCategories = ['Confectionery', 'Snacks', 'Namkeen', 'Candies', 'Dry Fruits'];
      for (let c of defaultCategories) {
        await pool.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [c]);
      }
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}
initDatabase();

// --- BREVO EMAIL UTILITY ---
const sendOTPEmail = async (toEmail, otpCode, recipientName = 'Partner') => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.SENDER_EMAIL || 'xllentfoods91@gmail.com', name: "Xllent Foods" };
  sendSmtpEmail.to = [{ email: toEmail, name: recipientName }];
  sendSmtpEmail.subject = "Your Verification Code - Xllent Foods DMS";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #d97706; text-align: center;">Xllent Foods</h2>
      <p>Hello <b>${recipientName}</b>,</p>
      <p>You requested an OTP for password recovery on the Xllent Foods Distribution Management System.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; background: #fef3c7; color: #b45309; padding: 12px 24px; letter-spacing: 6px; border-radius: 8px; display: inline-block;">${otpCode}</span>
      </div>
      <p>This code is valid for 10 minutes. Do not share this code with anyone.</p>
    </div>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error("Brevo Email Error:", error);
    throw new Error("Failed to send OTP email via Brevo");
  }
};

// --- HEALTH CHECK ROUTE ---
app.get('/', (req, res) => {
  res.status(200).json({ status: 'online', service: 'Xllent Foods DMS Backend' });
});

// --- AUTH & USER PROVISIONING ---
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

app.post('/api/admin/users/create', async (req, res) => {
  try {
    const { name, email, password, role, phone, location, latitude, longitude, parentId } = req.body;
    
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password || 'Admin@123', 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, location, latitude, longitude, parent_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email, role`,
      [name, email, hashedPassword, role, phone, location, latitude || null, longitude || null, parentId || null]
    );

    res.status(201).json({ message: 'User provisioned successfully', user: result.rows[0] });
  } catch (err) {
    console.error('User Creation Error:', err);
    res.status(500).json({ message: 'Server error during user creation' });
  }
});

// --- CATEGORY & PRODUCT MANAGEMENT ---
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
    let result = await pool.query("SELECT * FROM products");
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error loading products' });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, category, sku, mrp, status, image } = req.body;
    const result = await pool.query(
      "INSERT INTO products (name, category, sku, mrp, status, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, category, sku, mrp, status || 'In Stock', image]
    );
    res.status(201).json({ message: 'Product added successfully', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// --- PRICING BRACKETS ---
app.post('/api/pricing/set', async (req, res) => {
  try {
    const { productId, roleTarget, ownerId, customPrice } = req.body;
    await pool.query(`
      INSERT INTO product_pricing (product_id, role_target, owner_id, custom_price)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, role_target, owner_id) 
      DO UPDATE SET custom_price = EXCLUDED.custom_price
    `, [productId, roleTarget, ownerId, customPrice]);

    res.json({ message: 'Pricing bracket updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to set pricing' });
  }
});

// --- SMART ORDER ROUTING & FULFILLMENT ---
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.name as buyer_name, u.email as buyer_email 
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

app.post('/api/orders/smart', async (req, res) => {
  try {
    const { buyerId, items, totalAmount } = req.body;

    const buyerRes = await pool.query("SELECT * FROM users WHERE id = $1", [buyerId]);
    if (buyerRes.rows.length === 0) return res.status(404).json({ message: 'Buyer not found' });
    const buyer = buyerRes.rows[0];

    let targetSellerId = buyer.parent_id;

    if (!targetSellerId && buyer.role === 'shop') {
      const distributorQuery = await pool.query("SELECT id FROM users WHERE role = 'distributor' LIMIT 1");
      if (distributorQuery.rows.length > 0) {
        targetSellerId = distributorQuery.rows[0].id;
      } else {
        const ssQuery = await pool.query("SELECT id FROM users WHERE role = 'super_stockist' LIMIT 1");
        if (ssQuery.rows.length > 0) targetSellerId = ssQuery.rows[0].id;
      }
    }

    const orderResult = await pool.query(
      "INSERT INTO orders (buyer_id, seller_id, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [buyerId, targetSellerId || null, totalAmount, 'Pending']
    );
    const orderId = orderResult.rows[0].id;

    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    res.status(201).json({ message: 'Order routed and placed successfully', orderId, assignedSellerId: targetSellerId });
  } catch (err) {
    console.error('Smart Order Error:', err);
    res.status(500).json({ message: 'Failed to place smart order' });
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

// --- GLOBAL ERROR CATCHER ---
app.use((err, req, res, next) => {
  console.error('Unhandled Express Error:', err.stack);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));