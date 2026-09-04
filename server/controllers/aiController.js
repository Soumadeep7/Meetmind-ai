const Groq = require("groq-sdk");
const Meeting = require("../models/Meeting");
const ActionItem = require("../models/ActionItem");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const analyzeMeeting = async (req, res) => {
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

    // Check transcript
    if (!meeting.transcript) {
      return res.status(400).json({
        success: false,
        message: "Meeting transcript is required for AI analysis",
      });
    }

    // Send transcript to Groq
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are an AI meeting assistant. Analyze the meeting transcript and provide a concise summary and action items.",
        },
        {
          role: "user",
          content: `
Analyze the following meeting transcript.

Return the response as valid JSON with exactly this structure:

{
  "summary": "A concise summary of the meeting",
  "actionItems": [
    {
      "task": "Task description",
      "assignee": "Person responsible or empty string",
      "dueDate": "YYYY-MM-DD or null"
    }
  ]
}

Do not include markdown.
Do not include explanations outside the JSON.

Meeting transcript:
${meeting.transcript}
`,
        },
      ],
      temperature: 0.2,
    });

    const aiResponse = completion.choices[0].message.content;

    // Convert AI response to JavaScript object
    const result = JSON.parse(aiResponse);

    // Save summary to meeting
    meeting.summary = result.summary;
    await meeting.save();

    // Delete previously generated action items
    // so repeated AI analysis doesn't create duplicates
    await ActionItem.deleteMany({
      meeting: meeting._id,
      user: req.user.userId,
    });

    // Create AI-generated action items
    // Create AI-generated action items
const actionItems = [];

for (const item of result.actionItems) {
  const assigneeName = (item.assignee || "").trim();

  let assignedUser = null;

  if (assigneeName) {
    const normalizedAssignee = assigneeName.toLowerCase();

    assignedUser = meeting.participants.find((participant) => {
      const participantName = (participant.name || "").toLowerCase();
      const participantEmail = (participant.email || "").toLowerCase();

      return (
        participantName === normalizedAssignee ||
        participantEmail === normalizedAssignee
      );
    });
  }

  const actionItem = await ActionItem.create({
    task: item.task,

    // Keep the name for display
    assignee: assigneeName,

    // Store the actual registered User ID
    assigneeUser: assignedUser ? assignedUser._id : null,

    dueDate: item.dueDate || null,
    status: "pending",
    meeting: meeting._id,
    user: req.user.userId,
  });

  actionItems.push(actionItem);
}

    // Return AI result
    res.status(200).json({
      success: true,
      message: "Meeting analyzed successfully",
      summary: result.summary,
      actionItems: result.actionItems,
    });
  } catch (error) {
    console.error("AI analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during AI analysis",
    });
  }
};

module.exports = {
  analyzeMeeting,
};