const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const { isValidId } = require("../utils/toApi");

// Token verify karta hai aur req.user set karta hai
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Purane (Mongo wale) token me ObjectId hota hai, wo ab valid id nahi
    const user = isValidId(decoded.id) ? await prisma.user.findUnique({ where: { id: decoded.id } }) : null;

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Sirf ADMIN role allow karta hai
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};

module.exports = { protect, adminOnly };
