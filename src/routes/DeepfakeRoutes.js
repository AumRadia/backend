const express = require("express");
const router = express.Router();
const multer = require("multer");
const Counter = require("../models/counter"); 
const DeepfakeScan = require("../models/DeepfakeScan"); // Import the new single model

// Configure Multer for Memory Storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// --- STEP 1: Upload File (Creates the Row) ---
router.post("/save-input", upload.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { userId, category } = req.body;
    if (!userId || !category) return res.status(400).json({ error: "Missing fields" });

    // 1. Generate Unique deepId
    const counter = await Counter.findOneAndUpdate(
      { id: "deepId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const deepId = counter.seq;

    // 2. Create the Single Document (Input fields only)
    const newScan = new DeepfakeScan({
      deepId,
      userId: Number(userId),
      category,
      mediaData: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      // Output fields (score, verdict) remain null for now
    });

    await newScan.save();

    // 3. Return deepId so Flutter can use it in Step 2
    res.json({
      success: true,
      message: "File saved",
      deepId: deepId 
    });

  } catch (error) {
    console.error("Deepfake Input Error:", error);
    res.status(500).json({ error: "Server error saving input" });
  }
});

// --- STEP 2: Save Results (Updates the Row) ---
router.post("/save-output", async (req, res) => {
  try {
    const { deepId, userId, resultScore, resultVerdict, outputId } = req.body;

    if (!deepId) return res.status(400).json({ error: "Missing deepId" });

    // 1. Find the existing document by deepId and Update it
    const updatedScan = await DeepfakeScan.findOneAndUpdate(
      { deepId: Number(deepId) }, // Filter
      { 
        $set: { 
          score: resultScore,
          verdict: resultVerdict,
          apiMediaId: outputId // Storing the API ID here
        } 
      },
      { new: true } // Return the updated doc
    );

    if (!updatedScan) {
      return res.status(404).json({ error: "Original scan not found" });
    }

    res.json({
      success: true,
      message: "Results merged into scan record",
      data: updatedScan
    });

  } catch (error) {
    console.error("Deepfake Output Error:", error);
    res.status(500).json({ error: "Server error saving output" });
  }
});

module.exports = router;