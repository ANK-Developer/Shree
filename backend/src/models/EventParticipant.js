const mongoose = require("mongoose");
const { Schema } = mongoose;

const eventParticipantSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    participationStatus: {
      type: String,
      enum: ["ACCEPTED", "REJECTED", "NOT_CONFIRMED"],
      default: "NOT_CONFIRMED",
      required: true,
    },

    // Call summary (EventCall se sync rehta hai) taaki list me har row ke liye alag lookup na lage
    callCount: {
      type: Number,
      default: 0,
    },

    lastCalledAt: {
      type: Date,
      default: null,
    },

    lastCallStatus: {
      type: String,
      enum: ["PENDING", "ANSWERED", "NOT_ANSWERED", "BUSY", "FAILED", null],
      default: null,
    },

    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Same member cannot register twice for the same event.
eventParticipantSchema.index({ eventId: 1, memberId: 1 }, { unique: true });

eventParticipantSchema.index({
  eventId: 1,
  participationStatus: 1,
});

module.exports = mongoose.model("EventParticipant", eventParticipantSchema);
