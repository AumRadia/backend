const mongoose = require("mongoose");

const SafeScanSchema = new mongoose.Schema(
  {
    // ID and User Info
    safeId: { type: Number, unique: true, index: true },
    userId: { type: Number, required: true },

    // Source Info (Matching ExplicitCheck style)
    sourceType: { type: String, enum: ["url", "file"], default: "file" },
    sourceFilename: String,

    // Image Data (Kept from your original SafeInput so you don't lose the image)
    mediaData: { type: Buffer }, 
    contentType: { type: String },

    // Scores (0-100, matching ExplicitCheck style)
    safePercent: Number,
    partialPercent: Number,
    rawPercent: Number,
  },
  { 
    timestamps: true, // Adds createdAt and updatedAt
    collection: "safe_scans" 
  }
);

module.exports = mongoose.model("SafeScan", SafeScanSchema);