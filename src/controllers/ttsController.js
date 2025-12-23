const fs = require('fs');
const path = require('path');

// We use a lazy-loaded singleton for the TTS engine to avoid reloading the model on every request
let ttsInstance = null;
let kokoroModule = null;

async function getTTS() {
  if (ttsInstance) return ttsInstance;

  console.log("⏳ Initializing Kokoro TTS Model (82M)...");
  
  // Dynamic import for ESM compatibility
  if (!kokoroModule) {
    kokoroModule = await import('kokoro-js');
  }
  
  const { KokoroTTS } = kokoroModule;
  
  // Initialize the model (using q8 quantization for speed/memory balance)
  ttsInstance = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
    dtype: "q8", // options: fp32, fp16, q8, q4
    device: "cpu", // Node.js runs on CPU
  });
  
  console.log("✅ Kokoro TTS Model Loaded!");
  return ttsInstance;
}

exports.generateAudio = async (req, res) => {
  try {
    // 1. Destructure speed from body
    const { text, voice, speed } = req.body; // <--- Added speed

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const tts = await getTTS();
    
    const selectedVoice = voice || "af_heart";
    const selectedSpeed = speed || 1.0; // <--- Default speed

    console.log(`🎤 Generating: "${text.substring(0, 15)}..." | Voice: ${selectedVoice} | Speed: ${selectedSpeed}`);

    const audio = await tts.generate(text, {
      voice: selectedVoice,
      speed: selectedSpeed, // <--- Pass speed to library
    });

    const rawAudio = await audio.toWav();
    const wavBuffer = Buffer.from(rawAudio);

    res.writeHead(200, {
      'Content-Type': 'audio/wav',
      'Content-Length': wavBuffer.length,
    });
    res.end(wavBuffer);

  } catch (error) {
    console.error("❌ TTS Generation Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate audio", details: error.message });
    }
  }
};