const router = require("express").Router();
const { createMember, getMembers, getMemberStats, getMemberById, getReferredMembers, updateMemberStatus } = require("../controllers/memberController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadMemberPhoto } = require("../middleware/upload");

// Public: membership form submit
router.post("/", uploadMemberPhoto, createMember);

// Admin only
router.use(protect, adminOnly);
router.get("/", getMembers);
router.get("/stats", getMemberStats); // "/:id" se pehle, warna "stats" id samjha jayega
router.get("/:id", getMemberById);
router.get("/:id/referred", getReferredMembers);
router.patch("/:id/status", updateMemberStatus);

module.exports = router;
