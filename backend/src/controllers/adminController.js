const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { toApi, isValidId } = require("../utils/toApi");

// GET /api/admins?search=
const getAdmins = async (req, res) => {
  try {
    const where = { role: "ADMIN" };
    const search = String(req.query.search || "").trim();

    // MySQL collation (utf8mb4_unicode_ci) ki wajah se contains case-insensitive hai
    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }

    const admins = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" } });
    res.status(200).json({ success: true, admins: toApi(admins) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/admins
const createAdmin = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: "ADMIN",
      },
    });

    res.status(201).json({ success: true, message: "Admin created successfully", admin: toApi(admin) });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/admins/:id/status   body: { isActive }
const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid admin id" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be true or false" });
    }
    if (req.user.id === id && !isActive) {
      return res.status(400).json({ success: false, message: "You cannot deactivate yourself" });
    }

    const { count } = await prisma.user.updateMany({ where: { id, role: "ADMIN" }, data: { isActive } });
    if (count === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    const admin = await prisma.user.findUnique({ where: { id } });

    res.status(200).json({
      success: true,
      message: `Admin ${isActive ? "activated" : "deactivated"} successfully`,
      admin: toApi(admin),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/admins/:id/password   body: { newPassword, confirmPassword }
const resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid admin id" });
    }
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "New password and confirm password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const { count } = await prisma.user.updateMany({
      where: { id, role: "ADMIN" },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });
    if (count === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAdmins, createAdmin, updateAdminStatus, resetAdminPassword };
