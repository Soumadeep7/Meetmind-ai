const ActionItem = require("../models/ActionItem");
const Meeting = require("../models/Meeting");

const createActionItem = async (req, res) => {
  try {
    const { task, assignee, dueDate, status, meetingId } = req.body;

    // Validate task
    if (!task) {
      return res.status(400).json({
        success: false,
        message: "Task is required",
      });
    }

    // Validate meeting ID
    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting ID is required",
      });
    }

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

    // Create action item
    const actionItem = await ActionItem.create({
      task,
      assignee,
      dueDate,
      status,
      meeting: meetingId,
      user: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Action item created successfully",
      actionItem,
    });
  } catch (error) {
    console.error("Create action item error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating action item",
    });
  }
};

const getActionItemsByMeeting = async (req, res) => {
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

    // Get action items for this meeting
    const actionItems = await ActionItem.find({
      meeting: meetingId,
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: actionItems.length,
      actionItems,
    });
  } catch (error) {
    console.error("Get action items error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching action items",
    });
  }
};

const getMyActionItems = async (req, res) => {
  try {
    const actionItems = await ActionItem.find({
      assigneeUser: req.user.userId,
    })
      .populate("meeting", "title description")
      .populate("assigneeUser", "name email")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: actionItems.length,
      actionItems,
    });
  } catch (error) {
    console.error("Get my action items error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching your action items",
    });
  }
};

const updateActionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { task, assignee, dueDate, status } = req.body;

    // Find action item belonging to logged-in user
    const actionItem = await ActionItem.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!actionItem) {
      return res.status(404).json({
        success: false,
        message: "Action item not found",
      });
    }

    // Update only fields that were provided
    if (task !== undefined) {
      actionItem.task = task;
    }

    if (assignee !== undefined) {
      actionItem.assignee = assignee;
    }

    if (dueDate !== undefined) {
      actionItem.dueDate = dueDate;
    }

    if (status !== undefined) {
      actionItem.status = status;
    }

    await actionItem.save();

    res.status(200).json({
      success: true,
      message: "Action item updated successfully",
      actionItem,
    });
  } catch (error) {
    console.error("Update action item error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating action item",
    });
  }
};

const deleteActionItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Find action item belonging to logged-in user
    const actionItem = await ActionItem.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!actionItem) {
      return res.status(404).json({
        success: false,
        message: "Action item not found",
      });
    }

    await ActionItem.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: "Action item deleted successfully",
    });
  } catch (error) {
    console.error("Delete action item error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting action item",
    });
  }
};

module.exports = {
  createActionItem,
  getActionItemsByMeeting,
  getMyActionItems,
  updateActionItem,
  deleteActionItem,
};