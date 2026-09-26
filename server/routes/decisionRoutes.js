const express = require("express");

const {
  getDecisionsByMeeting,
  getMyDecisions,
} = require("../controllers/decisionController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get decisions for a specific meeting
router.get("/meeting/:meetingId", protect, getDecisionsByMeeting);

// Get all decisions for the logged-in user
router.get("/my", protect, getMyDecisions);

module.exports = router;