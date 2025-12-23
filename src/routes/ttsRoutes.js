// routes/ttsRoutes.js
const express = require("express");
const router = express.Router();
const ttsController = require("../controllers/ttsController");

// POST /api/tts/kokoro
router.post("/kokoro", ttsController.generateAudio);

module.exports = router;