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
  ssl: { rejectUnauthorized: false } // Required for secure cloud connections like Supabase
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
        reset_otp VARCHAR(10),
        otp_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure columns exist even if table was created previously without them
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'shop';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        mrp NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'In Stock',
        image TEXT
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

    // Seed default pricing tiers if not exists
    const tierCheck = await pool.query("SELECT * FROM pricing_tiers");
    if (tierCheck.rows.length === 0) {
      const defaultTiers = [
        ['tier-1', 'Super Stockist', 'Highest tier partner managing regional distribution hubs.', 35, 500000, 'Net 45 Days', 'Active'],
        ['tier-2', 'Distributor', 'Zonal partners supplying regional retail networks.', 25, 200000, 'Net 30 Days', 'Active'],
        ['tier-3', 'Retail Shop', 'Direct-to-consumer storefronts and local shops.', 15, 25000, 'Immediate / COD', 'Active']
      ];
      for (let t of defaultTiers) {
        await pool.query(
          "INSERT INTO pricing_tiers (tier_key, role_name, description, base_discount, min_order_value, payment_terms, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          t
        );
      }
      console.log('Default pricing tiers seeded successfully');
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
  sendSmtpEmail.sender = { 
    email: process.env.SENDER_EMAIL || 'xllentfoods91@gmail.com', 
    name: "Xllent Foods" 
  };
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
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Xllent Foods B2B Distribution Network</p>
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

// --- AUTH ROUTES ---
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

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: "No account found with this email" });

    const user = result.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query("UPDATE users SET reset_otp = $1, otp_expires = $2 WHERE email = $3", [otp, otpExpires, email]);

    await sendOTPEmail(user.email, otp, user.name);
    res.json({ message: "OTP sent successfully to your email via Brevo" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (result.rows.length === 0) return res.status(400).json({ message: "Invalid or expired OTP code" });
    const user = result.rows[0];

    if (user.reset_otp !== otp || new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1, reset_otp = NULL, otp_expires = NULL WHERE email = $2", [hashedPassword, email]);

    res.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PRODUCT ROUTES ---
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
    if (result.rows.length === 0 && (!category || category === 'All')) {
      const dummyProducts = [
        ['Xllent Premium Butter Cookies', 'Confectionery', 'XEL-BC-01', 150, 'In Stock'],
        ['Xllent Choco-Dip Wafers', 'Snacks', 'XEL-CW-02', 90, 'In Stock'],
        ['Xllent Spicy Masala Bhujia', 'Namkeen', 'XEL-MB-03', 60, 'In Stock'],
        ['Xllent Fruit Jam Drops', 'Candies', 'XEL-JD-04', 120, 'In Stock'],
        ['Xllent Roasted Cashew Crunch', 'Dry Fruits', 'XEL-RC-05', 299, 'In Stock'],
        ['Xllent Minty Fresh Chewing Gums', 'Confectionery', 'XEL-MF-06', 40, 'In Stock']
      ];
      for (let p of dummyProducts) {
        await pool.query("INSERT INTO products (name, category, sku, mrp, status) VALUES ($1, $2, $3, $4, $5)", p);
      }
      result = await pool.query("SELECT * FROM products");
    }
    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error loading products' });
  }
});

app.get('/api/products/public', async (req, res) => {
  try {
    let result = await pool.query("SELECT * FROM products");
    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: 'Failed to add product' });
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

// --- PARTNERSHIP ENQUIRY ROUTE ---
app.post('/api/partnership/enquiry', async (req, res) => {
  try {
    const { fullName, email, phone, roleType, location, message } = req.body;
    
    await pool.query(
      "INSERT INTO partnership_enquiries (full_name, email, phone, role_type, location, message) VALUES ($1, $2, $3, $4, $5, $6)",
      [fullName, email, phone, roleType, location, message]
    );

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.SENDER_EMAIL || 'xllentfoods91@gmail.com', name: "Xllent Foods Portal" };
    sendSmtpEmail.to = [{ email: 'xllentfoods91@gmail.com', name: "Xllent Admin" }];
    sendSmtpEmail.subject = `New Partnership Enquiry: ${roleType} - ${fullName}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #d97706; text-align: center;">New Partnership Application</h2>
        <p>You have received a new partnership application on the Xllent Foods platform:</p>
        <ul style="line-height: 1.6; font-size: 14px;">
          <li><b>Full Name:</b> ${fullName}</li>
          <li><b>Email:</b> ${email}</li>
          <li><b>Phone:</b> ${phone}</li>
          <li><b>Applying For:</b> ${roleType}</li>
          <li><b>Target Location:</b> ${location}</li>
          <li><b>Message:</b> ${message || 'N/A'}</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Xllent Foods B2B Automated Notification</p>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.status(201).json({ message: 'Partnership enquiry submitted successfully! Our team will contact you shortly.' });
  } catch (err) {
    console.error('Enquiry Error:', err);
    res.status(500).json({ message: 'Failed to submit enquiry. Please try again later.' });
  }
});

// --- ORDERS & FULFILLMENT ROUTES ---
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
    console.error('Fetch Orders Error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { buyerId, items, totalAmount } = req.body; 
    
    const orderResult = await pool.query(
      "INSERT INTO orders (buyer_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id",
      [buyerId, totalAmount, 'Pending']
    );
    const orderId = orderResult.rows[0].id;

    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// --- PRICING TIERS ROUTES ---
app.get('/api/admin/pricing-tiers', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pricing_tiers ORDER BY id ASC");
    res.json({ tiers: result.rows });
  } catch (err) {
    console.error('Fetch Pricing Tiers Error:', err);
    res.status(500).json({ message: 'Failed to fetch pricing tiers' });
  }
});

app.put('/api/admin/pricing-tiers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { baseDiscount, minOrderValue, paymentTerms, status } = req.body;

    const result = await pool.query(
      `UPDATE pricing_tiers 
       SET base_discount = $1, min_order_value = $2, payment_terms = $3, status = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
      [baseDiscount, minOrderValue, paymentTerms, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pricing tier not found' });
    }

    res.json({ message: 'Pricing tier updated successfully', tier: result.rows[0] });
  } catch (err) {
    console.error('Update Pricing Tier Error:', err);
    res.status(500).json({ message: 'Failed to update pricing tier' });
  }
});

// --- PARTNERSHIP ENQUIRY MANAGEMENT ROUTES ---
app.get('/api/admin/enquiries', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM partnership_enquiries ORDER BY created_at DESC");
    res.json({ enquiries: result.rows });
  } catch (err) {
    console.error('Fetch Enquiries Error:', err);
    res.status(500).json({ message: 'Failed to fetch partnership enquiries' });
  }
});

app.post('/api/admin/enquiries/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedRole, temporaryPassword } = req.body;

    const enquiryResult = await pool.query("SELECT * FROM partnership_enquiries WHERE id = $1", [id]);
    if (enquiryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }
    const enquiry = enquiryResult.rows[0];

    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [enquiry.email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'A user account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(temporaryPassword || 'Admin@123', 10);
    const userResult = await pool.query(
      "INSERT INTO users (name, email, password, role, phone, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role",
      [enquiry.full_name, enquiry.email, hashedPassword, assignedRole || 'distributor', enquiry.phone, enquiry.location]
    );

    await pool.query("DELETE FROM partnership_enquiries WHERE id = $1", [id]);

    res.status(201).json({ 
      message: 'Enquiry approved and converted into an active user account successfully!', 
      user: userResult.rows[0] 
    });
  } catch (err) {
    console.error('Approve Enquiry Error:', err);
    res.status(500).json({ message: 'Failed to approve and convert enquiry' });
  }
});

// --- ORDER INVOICE DETAILS ROUTE ---
app.get('/api/orders/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone, u.location as buyer_location 
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.id = $1
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const itemsResult = await pool.query(`
      SELECT oi.quantity, oi.unit_price, p.name as product_name, p.sku 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (err) {
    console.error('Fetch Invoice Error:', err);
    res.status(500).json({ message: 'Failed to generate invoice data' });
  }
});

// --- GLOBAL ERROR CATCHER ---
app.use((err, req, res, next) => {
  console.error('Unhandled Express Error:', err.stack);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));