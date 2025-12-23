const mongoose = require("mongoose");

const NewsInputSchema = new mongoose.Schema({
  // Using String for everything to ensure empty string compatibility as requested
  queryId: { type: String, default: "" }, // Link to associate inputs with outputs
  q: { type: String, default: "" },
  qInTitle: { type: String, default: "" },
  qInMeta: { type: String, default: "" },
  timeframe: { type: String, default: "" },
  country: { type: String, default: "" },
  excludecountry: { type: String, default: "" },
  category: { type: String, default: "" },
  excludecategory: { type: String, default: "" },
  language: { type: String, default: "" },
  excludelanguage: { type: String, default: "" },
  sort: { type: String, default: "" },
  url: { type: String, default: "" },
  tag: { type: String, default: "" },
  sentiment: { type: String, default: "" },
  organization: { type: String, default: "" },
  region: { type: String, default: "" },
  domain: { type: String, default: "" },
  domainurl: { type: String, default: "" },
  excludedomain: { type: String, default: "" },
  excludefield: { type: String, default: "" },
  prioritydomain: { type: String, default: "" },
  timezone: { type: String, default: "" },
  full_content: { type: String, default: "" },
  image: { type: String, default: "" },
  video: { type: String, default: "" },
  removeduplicate: { type: String, default: "" },
  size: { type: String, default: "" },
  page: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("NewsInput", NewsInputSchema);