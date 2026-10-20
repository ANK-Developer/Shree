const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const escapeRegex = require("../utils/escapeRegex");

// GET /api/admins?search=
const getAdmins = async (req, res) => {
  try {
    const filter = { role: "ADMIN" };
    const search = String(req.query.search || "").trim();

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const admins = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, admins });
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
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const admin = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: "ADMIN",
    });

    const { password: _hash, ...safeAdmin } = admin.toObject();
    res.status(201).json({ success: true, message: "Admin created successfully", admin: safeAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/admins/:id/status   body: { isActive }
const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid admin id" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be true or false" });
    }
    if (String(req.user._id) === id && !isActive) {
      return res.status(400).json({ success: false, message: "You cannot deactivate yourself" });
    }

    const admin = await User.findOneAndUpdate({ _id: id, role: "ADMIN" }, { isActive }, { new: true });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      message: `Admin ${isActive ? "activated" : "deactivated"} successfully`,
      admin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAdmins, createAdmin, updateAdminStatus };
