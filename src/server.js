const MELO_PYTHON_PATH = "C:\\Users\\AUM\\melotts-env\\Scripts\\python.exe";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectToDatabase } = require("./db");
const Visit = require("./models/Visit");
const https = require("https");
const myAiRoutes = require("./myAI/index");
const { spawn } = require('child_process'); // <--- NEW IMPORT
const path = require('path');               // <--- NEW IMPORT

// Import auth routes
const authRoutes = require("./routes/auth");
const User = require("./models/User"); // Ensure path matches where User.js is located

const conversionRoutes = require("./routes/conversionRoutes");
const Counter = require("./models/counter");
const interactionRoutes = require("./routes/interactions");
const newsRoutes = require("./routes/newsRoutes");
const deepfakeRoutes = require("./routes/DeepfakeRoutes");
const gdprRoutes = require("./routes/gdprRoutes")
const safetyRoutes = require("./routes/safetyRoutes");

//Telegram Route
const telegramRoutes = require("./telegramAPI/index");
const whisperRoutes = require("./routes/whisperRoute");
const usersRouter = require("./users");
const visitsRoutes = require("./visits");
const widgetRoutes = require('./widgets');
const plagiarismRoutes = require("./routes/plagiarism");
const imageSearchRoutes = require("./routes/imageSearch");
const ttsRoutes = require("./routes/ttsRoutes");
const pythonTtsRoutes = require("./routes/pythonTtsRoutes");

const app = express();

// CORS configuration to allow multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://auth-management-iota.vercel.app",
  "https://admin-panel-ten-wheat.vercel.app"
].filter(Boolean); // Remove any undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Helper function to clean IP address
function cleanIP(ip) {
  if (ip && ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }
  return ip;
}

// Helper function to get IP location data from ipapi.co
async function getIPLocation(ip) {
  return new Promise((resolve, reject) => {
    // Skip location lookup for local/private IPs
    if (
      ip === "localhost" ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      resolve(null);
      return;
    }

    const options = {
      hostname: "ipapi.co",
      port: 443,
      path: `/${ip}/json/`,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IPTracker/1.0)",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const apiResponse = JSON.parse(data);

          // Transform ipapi.co response to match our schema (same format as ipinfo.io)
          const locationData = {
            ip: apiResponse.ip,
            version : apiResponse.version,
            city: apiResponse.city,
            region: apiResponse.region,
            region_code : apiResponse.region_code,
            country: apiResponse.country_code,
            country_name : apiResponse.country_name,
            loc: `${apiResponse.latitude},${apiResponse.longitude}`,
            currency : apiResponse.currency,
            currency_name : apiResponse.currency_name,
            org: apiResponse.org,
            timezone: apiResponse.timezone,
            postal: apiResponse.postal,
          };
          resolve(locationData);
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.on("error", (error) => {
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

app.set("trust proxy", true);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan("combined"));

// ==========================================
// NEW: COSYVOICE ROUTE (Direct Python Execution)
// ==========================================
app.post('/api/tts/cosyvoice', (req, res) => {
    const { text, voice, speed } = req.body;

    if (!text) return res.status(400).json({ error: "Text is required" });

    // Defaults
    const voiceParam = voice || "af_heart";
    const speedParam = speed || 1.0;

    console.log(`🎤 Spawning Python for: "${text}"...`);

    // Spawn Python Process
    // Looking for file in: src/controllers/cosyvoice_cli.py
    const pythonProcess = spawn(MELO_PYTHON_PATH, [ // Use the full path defined at line 1
    path.join(__dirname, 'controllers', 'cosyvoice_cli.py'), 
    text,
    voiceParam,
    speedParam
]);

    // Set Response Headers
    res.set({
        'Content-Type': 'audio/wav',
    });

    // Pipe Python's "Standard Output" directly to the Response
    pythonProcess.stdout.pipe(res);

    // Error Handling
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`Python process exited with code ${code}`);
            // Check if headers already sent to avoid crashing node
            if (!res.headersSent) res.status(500).send("Generation failed.");
        } else {
            console.log("✅ Audio generation complete.");
        }
    });
});
// ==========================================


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/myai", myAiRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/users", usersRouter);
app.use("/api/visits", visitsRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/deepfake', deepfakeRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use("/api/plagiarism", plagiarismRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/image-search", imageSearchRoutes);
app.use("/api", conversionRoutes);
app.use(whisperRoutes);
app.use("/api/tts", ttsRoutes);
app.use("/api/python-tts", pythonTtsRoutes);

// UPDATED ROUTE: Checks permissions before saving input
// ... existing imports ...

// UPDATED ROUTE: With Debug Logs


// Test endpoint to check IP geolocation
app.get("/api/test-ip/:ip", async (req, res) => {
  try {
    const testIP = req.params.ip;
    const locationData = await getIPLocation(testIP);

    res.json({
      inputIP: testIP,
      location: locationData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get location data" });
  }
});

// Lightweight GET endpoint to be used as an image tracking pixel
app.get("/api/pixel", async (req, res) => {
  try {
    const rawIP =
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown";

    const ip = cleanIP(rawIP);

    const path = req.query?.path || "/";
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers["referer"] || req.headers["referrer"] || "";

    // Get location data for the IP
    const locationData = await getIPLocation(ip);

    const visit = new Visit({
      ipAddress: ip,
      path,
      userAgent,
      referer,
      location: locationData, // This will be null for local IPs
    });
    await visit.save();

    // 1x1 transparent GIF
    const gifBase64 =
      "R0lGODlhAQABAIAAAP///////yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const buf = Buffer.from(gifBase64, "base64");
    res.setHeader("Content-Type", "image/gif");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(200).end(buf);
  } catch (error) {
    res.status(500).end();
  }
});

// Additional endpoint for tracking page views with more details
app.get("/api/track", async (req, res) => {
  try {
    const rawIP =
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown";

    const ip = cleanIP(rawIP);

    const path = req.query?.path || "/";
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers["referer"] || req.headers["referrer"] || "";

    // Get location data for the IP
    const locationData = await getIPLocation(ip);

    const visit = new Visit({
      ipAddress: ip,
      path,
      userAgent,
      referer,
      location: locationData, // This will be null for local IPs
    });
    await visit.save();

    res.json({ success: true, path });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});


app.post("/api/track", async (req, res) => {
  try {
    const rawIP =
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown";

    const ip = cleanIP(rawIP);

    const path = req.body?.path || req.query?.path || "/";
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers["referer"] || req.headers["referrer"] || "";

    // Get location data for the IP
    const locationData = await getIPLocation(ip);

    const visit = new Visit({
      ipAddress: ip,
      path,
      userAgent,
      referer,
      location: locationData, // This will be null for local IPs
    });
    await visit.save();

    res.status(201).json({ saved: true });
  } catch (error) {
    res.status(500).json({ saved: false });
  }
});

const port = parseInt(process.env.PORT || "4000", 10);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      /* server started */
      console.log(`Server running on port ${port}`); // Added log so you know it started
    });
  })
  .catch(() => {
    process.exit(1);
  });