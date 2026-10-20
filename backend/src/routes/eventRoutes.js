const router = require("express").Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  syncParticipants,
  getParticipants,
  updateParticipantStatus,
  addCall,
  getCalls,
} = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadEventBanner } = require("../middleware/upload");

// protect pehle: unauthorized request ki file disk par save hi na ho
router.use(protect, adminOnly);

router.route("/").get(getEvents).post(uploadEventBanner, createEvent);
router.route("/:id").get(getEventById).put(uploadEventBanner, updateEvent).delete(deleteEvent);
router.patch("/:id/status", updateEventStatus);

router.post("/:id/sync-participants", syncParticipants);
router.get("/:id/participants", getParticipants);
router.patch("/:id/participants/:participantId", updateParticipantStatus);
router.route("/:id/participants/:participantId/calls").get(getCalls).post(addCall);

module.exports = router;
