const express = require("express");

const { analyzeMeeting } = require("../controllers/aiController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/meetings/:id/analyze", protect, analyzeMeeting);

module.exports = router;