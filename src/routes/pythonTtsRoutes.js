const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');

/**
 * Helper to spawn the Python TTS process.
 * Note the parameter order: text, voice, speed, noiseScale, res.
 */
const runPythonTTS = (scriptName, text, voice, speed, noiseScale, res) => {
    const pythonPath = "C:\\Users\\AUM\\melotts-env\\Scripts\\python.exe";
    const pythonScriptPath = path.join(__dirname, '..', 'controllers', scriptName);
    
    console.log(`🎤 Spawning ${scriptName} for: "${text}"`);
    console.log(`Params -> Voice: ${voice}, Speed: ${speed}, Noise: ${noiseScale}`);

    // Spawn Python with the arguments in the order the script expects
    const pythonProcess = spawn(pythonPath, ['-u', pythonScriptPath, text, voice, speed, noiseScale]);

    // Use setHeader to avoid "res.set is not a function" errors in different router versions
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the audio stream directly to the response
    pythonProcess.stdout.pipe(res);

    // Log Python errors to the console for debugging
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Log/Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0 && !res.headersSent) {
            res.status(500).send("Generation failed.");
        }
    });
};

/**
 * Route for MeloTTS
 */
router.post('/melo', (req, res) => {
    // Extract accent and noiseScale from the Flutter request body
    const { text, speed, noiseScale, accent } = req.body;
    
    // Defaulting logic to ensure we never send undefined to Python
    const voiceParam = accent || "Default"; 
    const speedParam = speed ? speed.toString() : "1.0";
    const nsParam = noiseScale ? noiseScale.toString() : "0.4";

    // Call the helper with all 6 arguments
    runPythonTTS('melo_cli.py', text, voiceParam, speedParam, nsParam, res);
});

module.exports = router;