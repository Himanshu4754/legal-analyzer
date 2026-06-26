const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  uploadDocument,
  getDocuments,
  getDocument,
  askDocumentQuestion,
  deleteDocument,
  compareDocuments,
} = require("../controllers/documentController");

router.post("/upload", protect, upload.single("pdf"), uploadDocument);
router.get("/", protect, getDocuments);
router.get("/:id", protect, getDocument);
router.post("/:id/ask", protect, askDocumentQuestion);
router.delete("/:id", protect, deleteDocument);
router.post("/compare", protect, compareDocuments);

module.exports = router;