const mongoose = require("mongoose");
const Counter = require("./counter");

const NewsInteractionSchema = new mongoose.Schema(
  {
    shareId: { // Renamed from interactionId to shareId as requested
      type: Number,
      unique: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    newsId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["share", "like", "dislike", "subscribe", "unsubscribe"],
      required: true,
    },
    platform: {
      type: String,
      default: "mobile", // Default as requested
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: "shares", // <--- Named the table/collection "shares"
  }
);

// Auto-increment logic for shareId
NewsInteractionSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "shareId" }, // Creates a specific counter for shares
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.shareId = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("NewsInteraction", NewsInteractionSchema);