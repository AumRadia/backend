const mongoose = require("mongoose");

const ImpactRecordSchema = new mongoose.Schema({
  articleId: String,
  title: String,
  link: String,

  impactSummaryPdf: Buffer,
  fullImpactPdf: Buffer,

  quickSummaryPdf: Buffer,
  fullQuickPdf: Buffer,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ImpactRecord", ImpactRecordSchema);
