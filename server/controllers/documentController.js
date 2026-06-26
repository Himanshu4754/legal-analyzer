const Document = require("../models/Document");
const User = require("../models/User");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const { analyzeDocument, askQuestion } = require("../utils/analyzeDocument");

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check document limit for free users
    if (!req.user.isPremium && req.user.documentsCount >= 3) {
      return res.status(403).json({
        message: "Free plan limit reached. Upgrade to Premium.",
        upgradeRequired: true,
      });
    }

    const doc = await Document.create({
      user: req.user._id,
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      status: "processing",
    });

    const response = await axios.get(req.file.path, {
      responseType: "arraybuffer",
    });

    const pdfBuffer = Buffer.from(response.data);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      await Document.findByIdAndUpdate(doc._id, { status: "failed" });
      return res.status(400).json({ message: "Could not extract text from PDF" });
    }

    const analysis = await analyzeDocument(extractedText);

    const updatedDoc = await Document.findByIdAndUpdate(
      doc._id,
      {
        extractedText,
        summary: analysis.summary,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        riskyClauses: analysis.riskyClauses,
        keyPoints: analysis.keyPoints,
        status: "completed",
      },
      { returnDocument: "after" }
    );

    // Increment document count after successful upload
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { documentsCount: 1 },
    });

    return res.status(201).json(updatedDoc);
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .select("-extractedText")
      .sort({ createdAt: -1 });
    return res.json(documents);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.json(document);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const askDocumentQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }
    const answer = await askQuestion(document.extractedText, question);
    return res.json({ question, answer });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    await Document.findByIdAndDelete(req.params.id);
    return res.json({ message: "Document deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const compareDocuments = async (req, res) => {
  try {
    const { docId1, docId2 } = req.body;

    const [doc1, doc2] = await Promise.all([
      Document.findOne({ _id: docId1, user: req.user._id }),
      Document.findOne({ _id: docId2, user: req.user._id }),
    ]);

    if (!doc1 || !doc2) {
      return res.status(404).json({ message: "Documents not found" });
    }

    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Compare these two legal documents and respond ONLY with valid JSON:

Document 1 (${doc1.fileName}):
${doc1.extractedText?.substring(0, 4000)}

Document 2 (${doc2.fileName}):
${doc2.extractedText?.substring(0, 4000)}

Return this exact JSON:
{
  "recommendation": "Document 1 or Document 2",
  "reason": "one sentence why",
  "doc1": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"]
  },
  "doc2": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"]
  },
  "verdict": "2-3 sentence overall comparison"
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const comparison = JSON.parse(jsonMatch[0]);

    return res.json({
      doc1: { id: doc1._id, name: doc1.fileName, riskScore: doc1.riskScore, riskLevel: doc1.riskLevel },
      doc2: { id: doc2._id, name: doc2.fileName, riskScore: doc2.riskScore, riskLevel: doc2.riskLevel },
      comparison,
    });
  } catch (error) {
    console.error("COMPARE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  askDocumentQuestion,
  deleteDocument,
  compareDocuments,
};