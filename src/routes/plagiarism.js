const express = require('express');
const router = express.Router();
const Counter = require('../models/counter'); 
const PlagScan = require('../models/PlagScan'); // Import the new single model

// 1. SAVE INPUT (Step 1)
// Endpoint: POST /api/plagiarism/input
router.post('/input', async (req, res) => {
  try {
    const { userId, inputDocument } = req.body;

    if (!userId || !inputDocument) {
      return res.status(400).json({ success: false, message: 'Missing userId or document' });
    }

    // 1. Generate unique plagId
    const counter = await Counter.findOneAndUpdate(
      { id: "plagId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const plagId = counter.seq;

    // 2. Create the Single Document (Input fields only)
    const newScan = new PlagScan({
      plagId,
      userId,
      inputDocument,
      // aiProbability and humanProbability will default to 0
    });

    await newScan.save();

    res.json({
      success: true,
      message: 'Input saved successfully',
      plagId: plagId // Flutter needs this for Step 2
    });

  } catch (error) {
    console.error('Error saving plagiarism input:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 2. SAVE OUTPUT (Step 2)
// Endpoint: POST /api/plagiarism/output
router.post('/output', async (req, res) => {
  try {
    const { plagId, aiProbability, humanProbability } = req.body;

    if (!plagId || aiProbability === undefined || humanProbability === undefined) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // 1. Find the existing document by plagId and Update it
    const updatedScan = await PlagScan.findOneAndUpdate(
      { plagId: Number(plagId) }, // Filter
      { 
        $set: { 
          aiProbability,
          humanProbability
        } 
      },
      { new: true } // Return the updated doc
    );

    if (!updatedScan) {
      return res.status(404).json({ success: false, message: 'Original scan not found' });
    }

    res.json({
      success: true,
      message: 'Output saved successfully',
      data: updatedScan
    });

  } catch (error) {
    console.error('Error saving plagiarism output:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;