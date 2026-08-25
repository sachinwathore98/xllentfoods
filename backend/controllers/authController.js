const User = require('../models/User'); // Assuming your Mongoose User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/brevoEmail');

// 1. Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Create Lower Hierarchy User (Admin -> Super Stockist -> Distributor -> Shop -> Employee)
exports.createUserByHierarchy = async (req, res) => {
  try {
    const { name, email, password, role, parentId } = req.body;
    
    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists with this email" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role, // e.g., 'super_stockist', 'distributor', 'shop', 'employee'
      parentId: parentId || req.user.id // Linked to the creator's ID
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully and assigned to hierarchy", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Forgot Password - Send OTP via Brevo
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // Valid for 10 mins
    await user.save();

    // Send via Brevo
    await sendOTPEmail(user.email, otp, user.name);
    res.json({ message: "OTP sent successfully to your email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Verify OTP & Reset Password
exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.resetOtp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};