const mongoose = require("mongoose");
const { Schema } = mongoose;

const eventCallSchema = new Schema(
  {
    eventParticipantId: {
      type: Schema.Types.ObjectId,
      ref: "EventParticipant",
      required: true,
      index: true,
    },

    callStatus: {
      type: String,
      enum: ["PENDING", "ANSWERED", "NOT_ANSWERED", "BUSY", "FAILED"],
      default: "PENDING",
      required: true,
    },

    callResponse: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    calledAt: {
      type: Date,
      default: Date.now,
    },

    calledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

eventCallSchema.index({
  eventParticipantId: 1,
  calledAt: -1,
});

module.exports = mongoose.model("EventCall", eventCallSchema);
