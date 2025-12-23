const mongoose = require("mongoose");

const NewsOutputSchema = new mongoose.Schema({
  queryId: { type: String, default: "" }, // Link to the Input
  totalResults: { type: String, default: "" },
  article_id: { type: String, default: "" },
  title: { type: String, default: "" },
  link: { type: String, default: "" },
  source_id: { type: String, default: "" },
  source_url: { type: String, default: "" },
  source_icon: { type: String, default: "" },
  source_priority: { type: String, default: "" },
  keywords: { type: String, default: "" }, // Storing arrays as string or use [String] if preferred
  creator: { type: String, default: "" },
  image_url: { type: String, default: "" },
  video_url: { type: String, default: "" },
  description: { type: String, default: "" },
  pubDate: { type: String, default: "" },
  pubDateTZ: { type: String, default: "" },
  content: { type: String, default: "" },
  country: { type: String, default: "" },
  category: { type: String, default: "" },
  language: { type: String, default: "" },
  ai_tag: { type: String, default: "" },
  sentiment: { type: String, default: "" },
  sentiment_stats: { type: String, default: "" },
  ai_region: { type: String, default: "" },
  ai_org: { type: String, default: "" },
  duplicate: { type: String, default: "" },
  coin: { type: String, default: "" },
  ai_summary: { type: String, default: "" },
  nextPage: { type: String, default: "" },
  location: { type: String, default: "" },
  subcategory: { type: String, default: "" }
});

module.exports = mongoose.model("NewsOutput", NewsOutputSchema);