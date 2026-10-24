const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const generateToken = require("../utils/generateToken");

const sanitize = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/login  (admin only)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      omit: { password: false },
    });
    const valid = user && (await bcrypt.compare(String(password), user.password));

    if (!valid || user.role !== "ADMIN" || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Admins page par "Last Login" dikhane ke liye
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.status(200).json({
      success: true,
      token: generateToken(user.id, user.role),
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
