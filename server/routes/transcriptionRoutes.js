const express = require("express");
const multer = require("multer");

const protect = require("../middleware/authMiddleware");
const {
  transcribeMeeting,
} = require("../controllers/transcriptionController");

const router = express.Router();

// Store uploaded audio temporarily
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

router.post(
  "/meetings/:id/transcribe",
  protect,
  upload.single("audio"),
  transcribeMeeting
);

module.exports = router;