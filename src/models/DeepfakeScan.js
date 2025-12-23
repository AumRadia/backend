const mongoose = require("mongoose");

const DeepfakeScanSchema = new mongoose.Schema(
  {
    // Unique ID for the scan (Auto-incremented manually in routes)
    deepId: {
      type: Number,
      unique: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    // Input Data (File)
    mediaData: {
      type: Buffer, 
      required: true, 
    },
    contentType: {
      type: String, 
      required: true, 
    },
    originalName: {
      type: String, 
    },
    category: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    
    // Output Data (Results) - Initially null until step 2
    score: {
      type: Number,
      default: null
    },
    verdict: {
      type: String,
      default: null
    },
    apiMediaId: {
      type: String, // The ID returned by Sightengine
      default: null
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "deepfake_scans" // Single collection name
  }
);

module.exports = mongoose.model("DeepfakeScan", DeepfakeScanSchema);