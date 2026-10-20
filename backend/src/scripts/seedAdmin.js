require("dotenv").config();
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL.toLowerCase();

    if (await prisma.user.findUnique({ where: { email } })) {
      console.log("Admin already exists:", email);
    } else {
      await prisma.user.create({
        data: {
          name: process.env.ADMIN_NAME || "Admin",
          email,
          password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
          role: "ADMIN",
        },
      });
      console.log("Admin created:", email);
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
