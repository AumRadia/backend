//
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Counter = require("../models/counter");
const Conversion = require("../models/Conversion"); // Import the updated model

// 1. SAVE INPUT (Step 1)
router.post("/save-input", async (req, res) => {
  try {
    console.log("--- NEW SUBMISSION ATTEMPT (Single Table) ---");
    const { userId, userEmail, from, to, prompt, inputParams } = req.body;

    // --- Validation ---
    if (!userId || !from || !to || !prompt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // --- User Permission Checks ---
    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (!user.status || user.status.toLowerCase() !== "active") {
        return res.status(403).json({ error: "Not an active user." });
      }

      if (!user.userType || user.userType.toLowerCase() !== "paid") {
        return res.status(403).json({ error: "Not a paid user." });
      }

      const currentTokens = user.tokens || 0;
      if (currentTokens <= 10) {
        return res.status(403).json({ error: "Insufficient tokens (Need > 10)." });
      }

      console.log("Permission checks passed for user:", userEmail);
    } else {
       return res.status(401).json({ error: "Please log in to submit." });
    }

    // --- Generate ID ---
    const counter = await Counter.findOneAndUpdate(
      { id: "promptId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const promptId = counter.seq;

    // --- Save Input ---
    const newEntry = new Conversion({
      promptId,
      userId,
      from,
      to,
      prompt,
      inputParams: inputParams || {}
    });

    await newEntry.save();

    return res.json({
      success: true,
      message: "Input saved successfully",
      data: newEntry,
      promptId: promptId 
    });

  } catch (error) {
    console.error("CRITICAL SERVER ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. SAVE OUTPUT (Step 2 - UPDATED)
router.post("/save-output", async (req, res) => {
  try {
    // Added 'errorLogs' to destructuring
    const { promptId, userId, content, modelName, outputParams, errorLogs } = req.body;

    if (!promptId || !userId || !content || !modelName) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // A. FIND THE ENTRY FIRST
    const conversion = await Conversion.findOne({ promptId: Number(promptId) });

    if (!conversion) {
      return res.status(404).json({ error: "Original prompt not found" });
    }

    // B. HISTORY LOGIC: Move old content to history array
    if (conversion.content) {
      // Pushing just the STRING, as requested
      conversion.outputsHistory.push(conversion.content);
    }

    // C. UPDATE CURRENT CONTENT
    conversion.content = content;
    conversion.modelName = modelName;
    if (outputParams) {
      conversion.outputParams = outputParams;
    }

    // --- NEW: SAVE ERROR LOGS ---
    // Stores simple array: [{ provider: "A1", error: "404" }, ...]
    if (errorLogs && Array.isArray(errorLogs)) {
      conversion.errorLogs = errorLogs;
    }

    // D. SAVE
    await conversion.save();

    return res.json({ success: true, data: conversion });

  } catch (error) {
    console.error("Save output failed:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. MARK REGULAR TOOL
router.post("/mark-regular-tool", async (req, res) => {
  try {
    const { promptId } = req.body;

    if (!promptId) {
      return res.status(400).json({ error: "Missing promptId" });
    }

    const updatedEntry = await Conversion.findOneAndUpdate(
      { promptId: Number(promptId) },
      { $set: { isRegularTool: true } },
      { new: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    return res.json({ 
      success: true, 
      message: "Feedback recorded", 
      data: updatedEntry 
    });

  } catch (error) {
    console.error("Update regular tool failed:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;