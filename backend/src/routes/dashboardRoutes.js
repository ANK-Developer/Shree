const router = require("express").Router();
const { getDashboard } = require("../controllers/dashboardController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);
router.get("/", getDashboard);

module.exports = router;
