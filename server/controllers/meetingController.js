const Meeting = require("../models/Meeting");
const ActionItem = require("../models/ActionItem");

const createMeeting = async (req, res) => {
  try {
    const {
      title,
      description,
      transcript,
      summary,
      participants,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Meeting title is required",
      });
    }

    const meeting = await Meeting.create({
      title,
      description,
      transcript,
      summary,
      user: req.user.userId,
      participants: [
        req.user.userId,
        ...(Array.isArray(participants) ? participants : []),
      ].filter(
        (id, index, array) =>
          array.findIndex((item) => item.toString() === id.toString()) === index
      ),
    });

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    console.error("Create meeting error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating meeting",
    });
  }
};

const getMeetings = async (req, res) => {
  try {
    // Get only meetings belonging to logged-in user
    const meetings = await Meeting.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error("Get meetings error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching meetings",
    });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find meeting belonging to logged-in user
    const meeting = await Meeting.findOne({
      _id: id,
      user: req.user.userId,
    }).populate("participants", "name email");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error("Get meeting error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching meeting",
    });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, transcript, summary } = req.body;

    // Find meeting belonging to logged-in user
    const meeting = await Meeting.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Update only fields that were provided
    if (title !== undefined) {
      meeting.title = title;
    }

    if (description !== undefined) {
      meeting.description = description;
    }

    if (transcript !== undefined) {
      meeting.transcript = transcript;
    }

    if (summary !== undefined) {
      meeting.summary = summary;
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      meeting,
    });
  } catch (error) {
    console.error("Update meeting error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating meeting",
    });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    // Find meeting belonging to logged-in user
    const meeting = await Meeting.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Delete all action items belonging to this meeting
    await ActionItem.deleteMany({
      meeting: id,
      user: req.user.userId,
    });

    // Delete the meeting
    await Meeting.deleteOne({
      _id: id,
    });

    res.status(200).json({
      success: true,
      message: "Meeting and associated action items deleted successfully",
    });
  } catch (error) {
    console.error("Delete meeting error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting meeting",
    });
  }
};
module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
};