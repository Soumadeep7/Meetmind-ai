const Decision = require("../models/Decision");
const Meeting = require("../models/Meeting");

const getDecisionsByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Make sure the meeting belongs to the logged-in user
    const meeting = await Meeting.findOne({
      _id: meetingId,
      user: req.user.userId,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const decisions = await Decision.find({
      meeting: meetingId,
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: decisions.length,
      decisions,
    });
  } catch (error) {
    console.error("Get decisions by meeting error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching decisions",
    });
  }
};

const getMyDecisions = async (req, res) => {
  try {
    const decisions = await Decision.find({
      user: req.user.userId,
    })
      .populate("meeting", "title description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: decisions.length,
      decisions,
    });
  } catch (error) {
    console.error("Get my decisions error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching your decisions",
    });
  }
};

module.exports = {
  getDecisionsByMeeting,
  getMyDecisions,
};