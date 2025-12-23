const mongoose = require("mongoose");

const GdprScanSchema = new mongoose.Schema(
  {
    // Optional: Keep gdprId if you want sequential IDs like your other tools, 
    // otherwise you can remove this field and the unique index.
    gdprId: {
      type: Number,
      unique: true,
      index: true,
    },
    userId: {
      type: Number, // Changed to Number to match your User system & Flutter app
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      default: 0
    },
    sslSecure: {
      type: Boolean,
      default: false
    },
    privacyPolicyFound: {
      type: Boolean,
      default: false
    },
    cookieBannerFound: {
      type: Boolean,
      default: false
    },
    // Meta fields (optional, based on your preference)
    source: {
      type: String,
      default: "API"
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "gdpr_scans" // Single collection
  }
);

module.exports = mongoose.model("GdprScan", GdprScanSchema);