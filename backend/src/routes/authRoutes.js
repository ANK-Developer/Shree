const router = require("express").Router();
const { login, getMe } = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/login", login);
router.get("/me", protect, adminOnly, getMe);

module.exports = router;
