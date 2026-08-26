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
        super_stockist_price NUMERIC(10,2) DEFAULT 0,
        distributor_price NUMERIC(10,2) DEFAULT 0,
        shop_price NUMERIC(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'In Stock',
        image TEXT,
        description TEXT,
        pieces_per_packet INT DEFAULT 1,
        packets_per_carton INT DEFAULT 1
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS super_stockist_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS distributor_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_price NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces_per_packet INT DEFAULT 1;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS packets_per_carton INT DEFAULT 1;

      CREATE TABLE IF NOT EXISTS downline_pricing_overrides (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        custom_price NUMERIC(10,2) NOT NULL,
        UNIQUE(product_id, user_id)
      );

      ALTER TABLE downline_pricing_overrides ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;

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

// --- FINANCIAL OVERVIEW METRICS ROUTE ---
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
    const { name, category, sku, mrp, superStockistPrice, distributorPrice, shopPrice, status, image, description, piecesPerPacket, packetsPerCarton } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, category, sku, mrp, super_stockist_price, distributor_price, shop_price, status, image, description, pieces_per_packet, packets_per_carton) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, category, sku, mrp, superStockistPrice || 0, distributorPrice || 0, shopPrice || 0, status || 'In Stock', image, description, piecesPerPacket || 1, packetsPerCarton || 1]
    );
    res.status(201).json({ message: 'Product added successfully with packaging metrics', product: result.rows[0] });
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ message: 'Failed to add product' });
  }
});

app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query("UPDATE categories SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category updated successfully', category: result.rows[0] });
  } catch (err) {
    console.error('Update Category Error:', err);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, sku, mrp, superStockistPrice, distributorPrice, shopPrice, status, image, description, piecesPerPacket, packetsPerCarton } = req.body;
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, category = $2, sku = $3, mrp = $4, super_stockist_price = $5, distributor_price = $6, shop_price = $7, status = $8, image = $9, description = $10, pieces_per_packet = $11, packets_per_carton = $12 
       WHERE id = $13 RETURNING *`,
      [name, category, sku, mrp, superStockistPrice || 0, distributorPrice || 0, shopPrice || 0, status || 'In Stock', image, description, piecesPerPacket || 1, packetsPerCarton || 1, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated successfully', product: result.rows[0] });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ message: 'Failed to update product' });
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

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

app.get('/api/admin/users-list', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role, location FROM users WHERE role != 'superadmin' ORDER BY role, name ASC");
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Fetch Users List Error:', err);
    res.status(500).json({ message: 'Failed to fetch users list' });
  }
});

app.get('/api/downline-pricing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT 
        p.id as product_id, p.name, p.sku, p.category, p.mrp, 
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
    console.error('Fetch User Pricing Error:', err);
    res.status(500).json({ message: 'Failed to fetch user pricing' });
  }
});

app.post('/api/downline-pricing/set-user-price', async (req, res) => {
  try {
    const { userId, productId, customPrice } = req.body;
    await pool.query(`
      INSERT INTO downline_pricing_overrides (user_id, product_id, custom_price)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET custom_price = EXCLUDED.custom_price
    `, [userId, productId, customPrice]);

    res.json({ message: 'User-specific product pricing successfully updated' });
  } catch (err) {
    console.error('User Pricing Override Error:', err);
    res.status(500).json({ message: 'Failed to update user pricing override' });
  }
});

// --- SCOPED HIERARCHY ORDERS ROUTE ---
app.get('/api/orders', async (req, res) => {
  try {
    const { userId, role } = req.query;

    let query = `
      SELECT o.id, o.total_amount, o.status, o.created_at, 
             b.name as buyer_name, b.email as buyer_email, b.role as buyer_role,
             s.name as seller_name, s.role as seller_role
      FROM orders o
      JOIN users b ON o.buyer_id = b.id
      LEFT JOIN users s ON o.seller_id = s.id
    `;

    let params = [];
    if (role && role !== 'admin' && role !== 'superadmin') {
      query += ` WHERE o.buyer_id = $1 OR o.seller_id = $1`;
      params.push(userId);
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

app.post('/api/orders/smart', async (req, res) => {
  try {
    const { buyerId, items, totalAmount, proxyForId } = req.body;

    const actualBuyerId = proxyForId || buyerId;
    const buyerRes = await pool.query("SELECT * FROM users WHERE id = $1", [actualBuyerId]);
    if (buyerRes.rows.length === 0) return res.status(404).json({ message: 'Buyer not found' });
    const buyer = buyerRes.rows[0];

    let targetSellerId = buyer.parent_id;

    if (!targetSellerId) {
      if (buyer.role === 'shop') {
        const distQuery = await pool.query("SELECT id FROM users WHERE role = 'distributor' LIMIT 1");
        if (distQuery.rows.length > 0) {
          targetSellerId = distQuery.rows[0].id;
        } else {
          const ssQuery = await pool.query("SELECT id FROM users WHERE role = 'super_stockist' LIMIT 1");
          if (ssQuery.rows.length > 0) targetSellerId = ssQuery.rows[0].id;
        }
      } else if (buyer.role === 'distributor') {
        const ssQuery = await pool.query("SELECT id FROM users WHERE role = 'super_stockist' LIMIT 1");
        if (ssQuery.rows.length > 0) targetSellerId = ssQuery.rows[0].id;
      } else if (buyer.role === 'super_stockist') {
        const adminQuery = await pool.query("SELECT id FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1");
        if (adminQuery.rows.length > 0) targetSellerId = adminQuery.rows[0].id;
      }
    }

    const orderResult = await pool.query(
      "INSERT INTO orders (buyer_id, seller_id, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [actualBuyerId, targetSellerId || null, totalAmount, 'Pending']
    );
    const orderId = orderResult.rows[0].id;

    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    res.status(201).json({ message: 'Order routed successfully through supply chain hierarchy', orderId, assignedSellerId: targetSellerId });
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

// --- FETCH DOWNLINE USERS SCOPED BY PARENT ID ---
app.get('/api/admin/downline-users', async (req, res) => {
  try {
    const { userId, role } = req.query;

    if (role === 'admin' || role === 'superadmin') {
      const result = await pool.query("SELECT id, name, email, role, phone, location, parent_id FROM users WHERE role != 'superadmin' ORDER BY role, name ASC");
      return res.json({ users: result.rows });
    }

    const result = await pool.query(`
      WITH RECURSIVE downline AS (
        SELECT id, name, email, role, phone, location, parent_id FROM users WHERE parent_id = $1
        UNION
        SELECT u.id, u.name, u.email, u.role, u.phone, u.location, u.parent_id FROM users u
        JOIN downline d ON u.parent_id = d.id
      )
      SELECT * FROM downline ORDER BY role, name ASC
    `, [userId]);

    res.json({ users: result.rows });
  } catch (err) {
    console.error('Fetch Downline Users Error:', err);
    res.status(500).json({ message: 'Failed to fetch downline users' });
  }
});

// --- UPDATE DOWNLINE USER DETAILS & PASSWORD ---
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location, password } = req.body;

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `UPDATE users SET name = $1, email = $2, phone = $3, location = $4, password = $5 WHERE id = $6 RETURNING id, name, email, role`,
        [name, email, phone, location, hashedPassword, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: 'User profile and password updated successfully', user: result.rows[0] });
    } else {
      const result = await pool.query(
        `UPDATE users SET name = $1, email = $2, phone = $3, location = $4 WHERE id = $5 RETURNING id, name, email, role`,
        [name, email, phone, location, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: 'User profile updated successfully', user: result.rows[0] });
    }
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// --- PARTNERSHIP ENQUIRY FORM ENDPOINT (Dual Route Support with Admin Alert & Sender Welcome Email) ---
const handlePartnershipEnquiry = async (req, res) => {
  try {
    const { fullName, email, phone, roleType, location, message } = req.body;

    // 1. Save to Database
    await pool.query(
      `INSERT INTO partnership_enquiries (full_name, email, phone, role_type, location, message) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [fullName, email, phone, roleType, location, message]
    );

    // 2. Send Emails via Brevo
    try {
      if (process.env.BREVO_API_KEY) {
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

        const senderEmail = process.env.SENDER_EMAIL || 'xllentfoods91@gmail.com';

        // --- EMAIL A: Notification to Admin (xllentfoods91@gmail.com) ---
        const adminEmail = new SibApiV3Sdk.SendSmtpEmail();
        adminEmail.sender = { email: senderEmail, name: "Xllent Foods Portal" };
        adminEmail.to = [{ email: senderEmail, name: "Admin" }];
        adminEmail.subject = `New Partnership Enquiry: ${roleType} - ${fullName}`;
        adminEmail.htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #d97706; text-align: center;">New Partnership Application</h2>
            <p>You have received a new partnership enquiry from your public website:</p>
            <ul style="line-height: 1.6; background: #f8fafc; padding: 15px 25px; border-radius: 8px;">
              <li><b>Full Name:</b> ${fullName}</li>
              <li><b>Email:</b> ${email}</li>
              <li><b>Phone:</b> ${phone}</li>
              <li><b>Role Requested:</b> ${roleType}</li>
              <li><b>Location:</b> ${location}</li>
              <li><b>Message:</b> ${message || 'N/A'}</li>
            </ul>
          </div>
        `;
        await apiInstance.sendTransacEmail(adminEmail);

        // --- EMAIL B: Welcome Email to the Sender ---
        const welcomeEmail = new SibApiV3Sdk.SendSmtpEmail();
        welcomeEmail.sender = { email: senderEmail, name: "Xllent Foods" };
        welcomeEmail.to = [{ email: email, name: fullName }];
        welcomeEmail.subject = "Welcome to Xllent Foods – Partnership Enquiry Received!";
        welcomeEmail.htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #d97706; margin: 0;">Xllent Foods</h2>
              <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Distribution Management System</p>
            </div>
            <p>Dear <b>${fullName}</b>,</p>
            <p>Thank you for your interest in partnering with <b>Xllent Foods</b> as a <b>${roleType}</b> for the <b>${location}</b> region.</p>
            <p>We have successfully received your application details. Our regional expansion team is currently reviewing your submission and will get in touch with you shortly to discuss wholesale margins, territory rights, and onboarding credentials.</p>
            <div style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
              <p style="margin: 0; font-size: 13px; color: #475569;"><b>Submitted Application Summary:</b></p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Role: ${roleType} | Location: ${location} | Phone: ${phone}</p>
            </div>
            <p>If you have any urgent queries, you can reach out to us directly at <a href="mailto:${senderEmail}" style="color: #d97706; text-decoration: none;">${senderEmail}</a>.</p>
            <p style="margin-top: 30px;">Warm regards,</p>
            <p style="font-weight: bold; color: #1e293b; margin-top: -10px;">The Xllent Foods Team</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated message from Xllent Foods. Please do not reply directly to this email.</p>
          </div>
        `;
        await apiInstance.sendTransacEmail(welcomeEmail);

      }
    } catch (emailErr) {
      console.error("Brevo Email Warning (Enquiry saved to DB):", emailErr.message);
    }

    res.status(201).json({ message: 'Enquiry submitted successfully! Our team will contact you shortly.' });
  } catch (err) {
    console.error('Partnership Enquiry Error:', err);
    res.status(500).json({ message: 'Failed to submit enquiry. Please try again.' });
  }
};

app.post('/api/partnership/enquiry', handlePartnershipEnquiry);
app.post('/partnership/enquiry', handlePartnershipEnquiry);

// --- ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error('Unhandled Express Error:', err.stack);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

// --- SERVER LISTENER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));