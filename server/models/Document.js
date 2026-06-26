const mongoose = require("mongoose");

const clauseSchema = new mongoose.Schema({
  text: String,
  risk: String,
  explanation: String,
});

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String },
    extractedText: { type: String },
    summary: { type: String },
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, default: "Low" },
    riskyClauses: [clauseSchema],
    keyPoints: [{ type: String }],
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);