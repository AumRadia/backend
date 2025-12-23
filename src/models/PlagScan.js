const mongoose = require("mongoose");

const PlagScanSchema = new mongoose.Schema(
  {
    // Unique ID for this scan
    plagId: { 
      type: Number, 
      unique: true, 
      index: true 
    },
    userId: { 
      type: String, // Keeping as String to match your provided files
      required: true 
    },
    inputDocument: { 
      type: String, 
      required: true 
    },
    
    // Output Fields (Results) - Defaults to 0 until analysis is done
    aiProbability: { 
      type: Number, 
      default: 0 
    },
    humanProbability: { 
      type: Number, 
      default: 0 
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "plagiarism_scans" // Single collection name
  }
);

module.exports = mongoose.model("PlagScan", PlagScanSchema);