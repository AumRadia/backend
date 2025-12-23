const express = require("express");
const router = express.Router();
const NewsInput = require("../models/NewsInput");
const NewsOutput = require("../models/NewsOutput");
const Counter = require("../models/counter"); 

// Route to save fetched news to DB
router.post("/save-batch", async (req, res) => {
  try {
    // FIX: Changed 'inputParams' to 'inputs' to match Flutter
    const { inputs, articles } = req.body; 

    // 1. Generate a unique Query ID
    const counter = await Counter.findOneAndUpdate(
      { id: "newsQueryId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const currentQueryId = counter.seq.toString();

    // 2. Save the Input Parameters
    const newInput = new NewsInput({
      queryId: currentQueryId,
      ...inputs // Spread the inputs object received from Flutter
    });
    await newInput.save();

    // 3. Process and Save the Articles (Outputs)
    const outputDocs = articles.map(article => ({
      queryId: currentQueryId,
      article_id: article.articleid || "",
      title: article.title || "",
      link: article.link || "",
      description: article.description || "",
      keywords: Array.isArray(article.keywords) ? article.keywords.join(", ") : "",
      creator: Array.isArray(article.creator) ? article.creator.join(", ") : "",
      image_url: article.imageurl || "",
      pubDate: article.pubdate || "",
      pubDateTZ: article.pubdatetz || "",
      source_id: article.sourceid || "",
      source_url: article.sourceurl || "",
      source_icon: article.sourceicon || "", // Added sourceicon matching Flutter
      source_priority: article.sourcepriority !== undefined ? article.sourcepriority.toString() : "0", // Safe handle for 0
      country: Array.isArray(article.country) ? article.country.join(", ") : "",
      category: Array.isArray(article.category) ? article.category.join(", ") : "",
      language: article.language || "",
      
      // Default empty fields
      content: "",
      video_url: "",
      ai_tag: "",
      sentiment: "",
      ai_summary: "",
      duplicate: article.duplicate ? "true" : "false"
    }));

    if (outputDocs.length > 0) {
      await NewsOutput.insertMany(outputDocs);
    }

    res.json({ success: true, count: outputDocs.length, queryId: currentQueryId });
  } catch (error) {
    console.error("Error saving news batch:", error);
    res.status(500).json({ error: "Failed to save news data" });
  }
});

module.exports = router;