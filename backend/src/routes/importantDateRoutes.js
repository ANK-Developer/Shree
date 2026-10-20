const router = require("express").Router();
const { getImportantDates } = require("../controllers/importantDateController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);
router.get("/", getImportantDates);

module.exports = router;
