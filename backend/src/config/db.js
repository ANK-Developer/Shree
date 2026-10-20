const { PrismaClient } = require("@prisma/client");

// Poore app me ek hi client. Password hash kabhi bhi response me na jaye, isliye default omit; login me explicitly mangwate hain.
const prisma = new PrismaClient({
  omit: { user: { password: true } },
});

const connectDB = async () => {
  try {
    await prisma.$connect();

    console.log("MySQL connected successfully");
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
