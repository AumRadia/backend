//
const mongoose = require("mongoose");

const ConversionSchema = new mongoose.Schema(
  {
    // --- INPUT FIELDS ---
    promptId: { 
      type: Number, 
      unique: true, 
      index: true 
    },
    userId: { 
      type: String, 
      required: true 
    },
    from: { 
      type: [String], 
      required: true 
    },
    to: { 
      type: [String], 
      required: true 
    },
    prompt: { 
      type: String, 
      required: true 
    },
    // inputParams will automatically store { temperature: 0.7, ... }
    inputParams: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
    isRegularTool: { 
      type: Boolean, 
      default: false 
    },

    // --- OUTPUT FIELDS ---
    content: { 
      type: String, 
      default: null 
    },
    
    // Stores: ["Old answer 1", "Old answer 2", ...]
    outputsHistory: {
      type: [String],
      default: []
    },

    modelName: { 
      type: String, 
      default: null 
    },
    outputParams: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    },

    // --- NEW: Error Logs (No Timestamp) ---
    // Stores a simple list of failures like: 
    // [{ provider: "OpenAI", error: "500 Server Error" }]
    errorLogs: {
      type: [
        {
          provider: String,
          error: String
        }
      ],
      default: []
    }
  },
  {
    timestamps: true, 
    collection: "conversions"
  }
);

module.exports = mongoose.model("Conversion", ConversionSchema);