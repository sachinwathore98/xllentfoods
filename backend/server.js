const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
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
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  sku: { type: String, required: true },
  mrp: { type: Number, required: true },
  status: { type: String, default: 'In Stock' }
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
        email: 'superadmin@xellent.com',
        password: hashedPassword,
        role: 'superadmin',
        phone: '9999999999'
      });
      console.log('Default SuperAdmin seeded: superadmin@xellent.com / Admin@123');
    }
  } catch (err) {
    console.error('Error seeding superadmin:', err);
  }
}
seedSuperAdmin();

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

    res.json({ token, role: user.role, name: user.name, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- PRODUCT ROUTES ---
app.get('/api/products/public', async (req, res) => {
  try {
    let products = await Product.find({});
    if (products.length === 0) {
      const dummyProducts = [
        { name: 'Xellent Premium Butter Cookies', category: 'Confectionery', sku: 'XEL-BC-01', mrp: 150, status: 'In Stock' },
        { name: 'Xellent Choco-Dip Wafers', category: 'Snacks', sku: 'XEL-CW-02', mrp: 90, status: 'In Stock' },
        { name: 'Xellent Spicy Masala Bhujia', category: 'Namkeen', sku: 'XEL-MB-03', mrp: 60, status: 'In Stock' },
        { name: 'Xellent Fruit Jam Drops', category: 'Candies', sku: 'XEL-JD-04', mrp: 120, status: 'In Stock' },
        { name: 'Xellent Roasted Cashew Crunch', category: 'Dry Fruits', sku: 'XEL-RC-05', mrp: 299, status: 'In Stock' },
        { name: 'Xellent Minty Fresh Chewing Gums', category: 'Confectionery', sku: 'XEL-MF-06', mrp: 40, status: 'In Stock' }
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
    const { name, category, sku, mrp, status } = req.body;
    const newProduct = new Product({ name, category, sku, mrp, status: status || 'In Stock' });
    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

// --- USER CREATION ENDPOINT (SuperAdmin / Admin / Stockist Onboarding) ---
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const { name, email, password, role, parentId, phone, location } = req.body;
    
    // Check if user already exists
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