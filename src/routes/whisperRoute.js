const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".wav";
    cb(null, `whisper_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage: storage });

router.post("/whisper", upload.single("audio"), async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file" });

    tempFilePath = req.file.path;
    const outputDir = os.tmpdir();

    // === READ PARAMS FROM FLUTTER ===
    const model = req.body.model || "small";
    const language = req.body.language || "en";
    const task = req.body.task || "transcribe"; 
    const fp16 = req.body.fp16 === 'true' ? "True" : "False";

    console.log(`🎤 Whisper Config: Model=${model}, Lang=${language}, Task=${task}`);

    const pythonCommand = "python"; 

    // Build Arguments
    const args = [
      "-m", "whisper", tempFilePath,
      "--model", model,
      "--output_dir", outputDir,
      "--fp16", fp16
    ];

    if (language !== "auto") {
      args.push("--language", language);
    }

    if (task === "translate") {
      args.push("--task", "translate");
    }

    // === FIX START: Declare these variables before using them ===
    let output = "";
    let errorOutput = "";
    // === FIX END ===

    const whisper = spawn(pythonCommand, args);

    whisper.stdout.on("data", (data) => {
      console.log(`Whisper: ${data}`);
      output += data.toString(); // Now this works!
    });

    whisper.stderr.on("data", (data) => {
      console.error(`Log: ${data}`);
      errorOutput += data.toString(); // Now this works!
    });

    whisper.on("error", (err) => {
      console.error("❌ FAILED TO START PYTHON:", err);
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(500).json({ error: "Server failed to start Python.", details: err.message });
    });

    whisper.on("close", (code) => {
      // Cleanup
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
      }

      if (code === 0) {
        console.log("✅ Transcription Complete");
        return res.json({ text: output.trim() });
      } else {
        console.error("❌ Whisper Process Exited with code:", code);
        // Prevent crashing if headers sent
        if (!res.headersSent) {
           return res.status(500).json({ 
            error: "Transcription process failed", 
            details: errorOutput || "Unknown error" 
          });
        }
      }
    });

  } catch (error) {
    console.error("❌ Critical Route Error:", error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
    }
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

module.exports = router;