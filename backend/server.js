const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

const app = express();

// --- CORS CONFIGURATION ---
const allowedOrigins = [
  'https://xllentfoods.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation: Access denied from this origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xellent-dms';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'superstockist', 'distributor', 'shop', 'employee'], 
    required: true 
  },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  phone: { type: String },
  location: { type: String },
  resetOtp: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  sku: { type: String, required: true },
  mrp: { type: Number, required: true },
  status: { type: String, default: 'In Stock' },
  image: { type: String }
});
const Product = mongoose.model('Product', productSchema);

// --- SEED DEFAULT SUPER ADMIN ---
async function seedSuperAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await User.create({
        name: 'Super Admin',
        email: 'superadmin@xllentfoods.com',
        password: hashedPassword,
        role: 'superadmin',
        phone: '9999999999'
      });
      console.log('Default SuperAdmin seeded: superadmin@xllentfoods.com / Admin@123');
    }
  } catch (err) {
    console.error('Error seeding superadmin:', err);
  }
}
seedSuperAdmin();

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

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role }, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTPEmail(user.email, otp, user.name);
    res.json({ message: "OTP sent successfully to your email via Brevo" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.resetOtp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PRODUCT ROUTES ---
app.get('/api/products/public', async (req, res) => {
  try {
    let products = await Product.find({});
    if (products.length === 0) {
      const dummyProducts = [
        { name: 'Xllent Premium Butter Cookies', category: 'Confectionery', sku: 'XEL-BC-01', mrp: 150, status: 'In Stock' },
        { name: 'Xllent Choco-Dip Wafers', category: 'Snacks', sku: 'XEL-CW-02', mrp: 90, status: 'In Stock' },
        { name: 'Xllent Spicy Masala Bhujia', category: 'Namkeen', sku: 'XEL-MB-03', mrp: 60, status: 'In Stock' },
        { name: 'Xllent Fruit Jam Drops', category: 'Candies', sku: 'XEL-JD-04', mrp: 120, status: 'In Stock' },
        { name: 'Xllent Roasted Cashew Crunch', category: 'Dry Fruits', sku: 'XEL-RC-05', mrp: 299, status: 'In Stock' },
        { name: 'Xllent Minty Fresh Chewing Gums', category: 'Confectionery', sku: 'XEL-MF-06', mrp: 40, status: 'In Stock' }
      ];
      await Product.insertMany(dummyProducts);
      products = await Product.find({});
    }
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Server error loading products' });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, category, sku, mrp, status, image } = req.body;
    const newProduct = new Product({ name, category, sku, mrp, status: status || 'In Stock', image });
    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// --- USER CREATION ENDPOINT ---
app.post('/api/auth/create-user', async (req, res) => {
  try {
    const { name, email, password, role, parentId, phone, location } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password || 'Xellent@123', 10);
    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      parentId: parentId || null,
      phone,
      location
    });

    res.status(201).json({ 
      message: 'Account created successfully', 
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error while creating user' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));