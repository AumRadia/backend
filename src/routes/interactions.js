const express = require("express");
const router = express.Router();
const NewsInteraction = require("../models/NewsInteraction");
const User = require("../models/User"); // Importing to validate user exists (optional)

router.post("/log", async (req, res) => {
  try {
    const { userEmail, newsId, action, platform } = req.body;

    if (!userEmail || !newsId || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Optional: Verify user exists before logging
    // const userExists = await User.findOne({ email: userEmail });
    // if (!userExists) return res.status(404).json({ error: "User not found" });

    const newInteraction = new NewsInteraction({
      userEmail,
      newsId,
      action,
      platform: platform || "mobile", // Defaults to mobile if not sent
    });

    await newInteraction.save();

    res.json({
      success: true,
      message: `${action} logged successfully`,
      data: newInteraction,
    });
  } catch (error) {
    console.error("Interaction Log Error:", error);
    res.status(500).json({ error: "Server error logging interaction" });
  }
});

module.exports = router;