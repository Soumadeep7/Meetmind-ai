const express = require("express");

const {
  createActionItem,
  getActionItemsByMeeting,
  getMyActionItems,
  updateActionItem,
  deleteActionItem,
} = require("../controllers/actionItemController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createActionItem);

// Get action items for a specific meeting
router.get("/meeting/:meetingId", protect, getActionItemsByMeeting);

// Get action items assigned to the logged-in user
router.get("/my", protect, getMyActionItems);

router.put("/:id", protect, updateActionItem);

router.delete("/:id", protect, deleteActionItem);

module.exports = router;