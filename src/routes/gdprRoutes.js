const express = require("express");
const router = express.Router();
const Counter = require("../models/counter"); 
const GdprScan = require("../models/GdprScan"); // Import the new single model

// POST /api/gdpr/save
router.post("/save", async (req, res) => {
  try {
    const { 
      userId, 
      url, 
      score, 
      sslSecure, 
      privacyPolicyFound, 
      cookieBannerFound,
      source 
    } = req.body;

    // 1. Validation
    if (!userId || !url) {
      return res.status(400).json({ error: "Missing userId or url" });
    }

    // 2. Generate Unique GDPR ID (Optional: keep this if you want sequential IDs like promptId)
    const counter = await Counter.findOneAndUpdate(
      { id: "gdprId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const gdprId = counter.seq;

    // 3. Save everything in ONE document
    const newScan = new GdprScan({
      gdprId,
      userId,
      url,
      score: score || 0,
      sslSecure: sslSecure || false,
      privacyPolicyFound: privacyPolicyFound || false,
      cookieBannerFound: cookieBannerFound || false,
      source: source || "API"
    });

    await newScan.save();

    // 4. Response
    return res.json({
      success: true,
      message: "GDPR Scan saved successfully",
      data: newScan
    });

  } catch (error) {
    console.error("Save GDPR failed:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;