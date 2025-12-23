const mongoose = require("mongoose");

const IpScanSchema = new mongoose.Schema(
  {
    // Unique ID for this scan
    ipId: { 
      type: Number, 
      unique: true, 
      index: true 
    },
    userId: { 
      type: String, // Keeping as String to match your provided files
      required: true 
    },
    image: { 
      type: String, // Base64 string of the image
      required: true 
    },
    
    // Output Fields (Results) - Defaults to null until API returns data
    apiOutput: { 
      type: Object, 
      default: null 
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "ip_scans" // Single collection name
  }
);

module.exports = mongoose.model("IpScan", IpScanSchema);