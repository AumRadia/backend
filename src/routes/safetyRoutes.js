const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Counter = require('../models/counter');
const SafeScan = require('../models/SafeScan'); // Import the new single model

// Store file in memory (RAM)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Sightengine Credentials
const API_USER = '1502436331';
const API_SECRET = '2qs2AefqLFdFanbxQXKEAWxfvp9pAbt6';

router.post('/analyze', upload.single('media'), async (req, res) => {
    try {
        const { userId } = req.body;
        
        // 1. Validation
        if (!req.file || !userId) {
            return res.status(400).json({ error: "Image and UserId are required" });
        }

        // 2. Generate new safeId
        const counter = await Counter.findOneAndUpdate(
            { id: "safeId" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const safeId = counter.seq;

        // 3. Send to Sightengine API
        const formData = new FormData();
        formData.append('models', 'nudity');
        formData.append('api_user', API_USER);
        formData.append('api_secret', API_SECRET);
        formData.append('media', req.file.buffer, { 
            filename: req.file.originalname || 'image.jpg',
            contentType: req.file.mimetype 
        });

        let nudity = { safe: 0, partial: 0, raw: 0 };
        
        try {
            const sightRes = await axios.post('https://api.sightengine.com/1.0/check.json', formData, {
                headers: formData.getHeaders(),
                timeout: 30000
            });

            if (sightRes.data.status === 'success') {
                nudity = sightRes.data.nudity;
            }
        } catch (apiError) {
            console.error("Sightengine API Error:", apiError.message);
            // We continue to save the entry even if API fails (scores will be 0)
        }

        // 4. Calculate Percentages (Match ExplicitCheck style)
        // API returns 0.0 to 1.0 -> We convert to 0.0 to 100.0
        const safePercent = nudity.safe ? +(nudity.safe * 100).toFixed(1) : 0;
        const partialPercent = nudity.partial ? +(nudity.partial * 100).toFixed(1) : 0;
        const rawPercent = nudity.raw ? +(nudity.raw * 100).toFixed(1) : 0;

        // 5. Save to Single Table
        const newScan = new SafeScan({
            safeId: safeId,
            userId: Number(userId),
            sourceType: "file",
            sourceFilename: req.file.originalname,
            mediaData: req.file.buffer,
            contentType: req.file.mimetype,
            safePercent,
            partialPercent,
            rawPercent
        });

        await newScan.save();

        // 6. Return response (Keeping structure compatible with your Flutter app)
        return res.json({
            success: true,
            safeId: safeId,
            nudity: {
                safe: nudity.safe,
                partial: nudity.partial,
                raw: nudity.raw
            },
            percentages: {
                safe: safePercent,
                partial: partialPercent,
                raw: rawPercent
            }
        });

    } catch (error) {
        console.error("Safety Analysis Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;