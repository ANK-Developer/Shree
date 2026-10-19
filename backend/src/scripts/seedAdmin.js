require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.ADMIN_EMAIL.toLowerCase();

    if (await User.findOne({ email })) {
      console.log("Admin already exists:", email);
    } else {
      await User.create({
        name: process.env.ADMIN_NAME || "Admin",
        email,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        role: "ADMIN",
      });
      console.log("Admin created:", email);
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
