const express = require("express");
const router = express.Router();
const Counter = require("../models/counter"); 
const IpScan = require("../models/IpScan"); // Import the new single model

// --- ROUTE 1: Save Input (User + Image) ---
// Endpoint: POST /api/image-search/save-input
router.post("/save-input", async (req, res) => {
  try {
    const { userId, image } = req.body;

    if (!userId || !image) {
      return res.status(400).json({ error: "Missing userId or image" });
    }

    // 1. Get next sequence for ipId
    const counter = await Counter.findOneAndUpdate(
      { id: "ipId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const ipId = counter.seq;

    // 2. Save Input to Single Table
    const newScan = new IpScan({
      ipId,
      userId,
      image,
      // apiOutput defaults to null
    });

    await newScan.save();

    // 3. Return ipId so frontend can use it for the output step
    res.json({ 
      success: true, 
      message: "Input saved", 
      ipId: ipId 
    });

  } catch (error) {
    console.error("Error saving image input:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// --- ROUTE 2: Save Output (API Result) ---
// Endpoint: POST /api/image-search/save-output
router.post("/save-output", async (req, res) => {
  try {
    const { ipId, apiOutput } = req.body;

    if (!ipId || !apiOutput) {
      return res.status(400).json({ error: "Missing ipId or apiOutput" });
    }

    // 1. Find the existing document by ipId and Update it
    const updatedScan = await IpScan.findOneAndUpdate(
      { ipId: Number(ipId) }, // Filter
      { 
        $set: { 
          apiOutput: apiOutput 
        } 
      },
      { new: true } // Return the updated doc
    );

    if (!updatedScan) {
      return res.status(404).json({ error: "Original scan not found" });
    }

    res.json({ 
      success: true, 
      message: "Output saved successfully",
      data: updatedScan
    });

  } catch (error) {
    console.error("Error saving image output:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;