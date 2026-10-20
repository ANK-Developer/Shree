const mongoose = require("mongoose");
const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    eventBanner: {
      type: String,
      trim: true,
      default: null,
    },

    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 5000,
    },

    status: {
      type: String,
      enum: ["UPCOMING", "LIVE", "COMPLETED", "CANCELLED"],
      default: "UPCOMING",
      required: true,
    },

    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
      maxlength: 300,
    },

    startDateTime: {
      type: Date,
      required: true,
    },

    endDateTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDateTime || value > this.startDateTime;
        },
        message: "End date and time must be after start date and time",
      },
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

eventSchema.index({ startDateTime: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model("Event", eventSchema);
