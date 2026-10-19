const router = require("express").Router();
const { getAdmins, createAdmin, updateAdminStatus } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

router.get("/", getAdmins);
router.post("/", createAdmin);
router.patch("/:id/status", updateAdminStatus);

module.exports = router;
