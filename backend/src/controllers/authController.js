const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const sanitize = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/login  (admin only)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    const valid = user && (await bcrypt.compare(password, user.password));

    if (!valid || user.role !== "ADMIN" || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: sanitize(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/auth/me
const getMe = (req, res) => {
  res.status(200).json({ success: true, user: sanitize(req.user) });
};

module.exports = { login, getMe };
