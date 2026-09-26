const Groq = require("groq-sdk");
const Meeting = require("../models/Meeting");
const ActionItem = require("../models/ActionItem");
const Decision = require("../models/Decision");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ==========================================
// Normalize text
// ==========================================

const normalizeText = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ==========================================
// Check whether two tasks are similar
// ==========================================

const areTasksSimilar = (taskA, taskB) => {
  const normalizedA = normalizeText(taskA);
  const normalizedB = normalizeText(taskB);

  if (!normalizedA || !normalizedB) {
    return false;
  }

  if (normalizedA === normalizedB) {
    return true;
  }

  const wordsA = [
    ...new Set(normalizedA.split(" ")),
  ];

  const wordsB = [
    ...new Set(normalizedB.split(" ")),
  ];

  const setB = new Set(wordsB);

  const commonWords = wordsA.filter((word) =>
    setB.has(word)
  );

  const smallerTaskSize = Math.min(
    wordsA.length,
    wordsB.length
  );

  if (
    smallerTaskSize > 0 &&
    commonWords.length === smallerTaskSize
  ) {
    return true;
  }

  const similarity =
    commonWords.length /
    Math.max(wordsA.length, wordsB.length);

  return similarity >= 0.6;
};

// ==========================================
// Find existing action item
// ==========================================

const findMatchingActionItem = (
  existingActionItems,
  taskText
) => {
  return existingActionItems.find((oldItem) =>
    areTasksSimilar(
      oldItem.task,
      taskText
    )
  );
};

// ==========================================
// CORE AI ANALYSIS FUNCTION
// ==========================================
//
// This function does NOT send an HTTP response.
//
// It can therefore be used by:
//
// 1. Re-analyze endpoint
// 2. Audio transcription endpoint
//
// ==========================================

const processMeetingWithAI = async (
  meetingId,
  userId
) => {
  // ==========================================
  // Find meeting
  // ==========================================

  const meeting = await Meeting.findOne({
    _id: meetingId,
    user: userId,
  }).populate(
    "participants",
    "name email"
  );

  if (!meeting) {
    const error = new Error(
      "Meeting not found"
    );

    error.statusCode = 404;

    throw error;
  }

  // ==========================================
  // Check transcript
  // ==========================================

  if (
    !meeting.transcript ||
    !meeting.transcript.trim()
  ) {
    const error = new Error(
      "Meeting transcript is required for AI analysis"
    );

    error.statusCode = 400;

    throw error;
  }

  // ==========================================
  // Send transcript to Groq
  // ==========================================

  const completion =
    await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",
          content:
            "You are an AI meeting assistant. Analyze the meeting transcript and provide a concise summary, important decisions, and actionable tasks.",
        },

        {
          role: "user",
          content: `
Analyze the following meeting transcript.

Return the response as valid JSON with exactly this structure:

{
  "summary": "A concise summary of the meeting",
  "decisions": [
    {
      "decision": "Important decision agreed upon during the meeting"
    }
  ],
  "actionItems": [
    {
      "task": "Task description",
      "assignee": "Person responsible or empty string",
      "dueDate": "YYYY-MM-DD or null"
    }
  ]
}

Rules:

1. Return only valid JSON.
2. Do not include markdown.
3. Do not include explanations outside the JSON.
4. Extract only meaningful decisions.
5. Extract only actionable tasks.
6. If a task has no clear assignee, use an empty string.
7. If a task has no deadline, use null.
8. Do not invent names that are not present in the transcript.
9. Do not create duplicate action items.
10. Each distinct task should appear only once.
11. Keep task descriptions concise and specific.
12. If the same task is mentioned multiple times, return it only once.

Meeting transcript:

${meeting.transcript}
`,
        },
      ],

      temperature: 0.2,
    });

  // ==========================================
  // Get AI response
  // ==========================================

  const aiResponse =
    completion.choices?.[0]?.message?.content;

  if (!aiResponse) {
    const error = new Error(
      "AI returned an empty response"
    );

    error.statusCode = 500;

    throw error;
  }

  // ==========================================
  // Parse AI JSON
  // ==========================================

  let result;

  try {
    result = JSON.parse(aiResponse);
  } catch (parseError) {
    console.error(
      "AI JSON parse error:",
      parseError
    );

    console.error(
      "AI response:",
      aiResponse
    );

    const error = new Error(
      "AI returned an invalid response"
    );

    error.statusCode = 500;

    throw error;
  }

  // ==========================================
  // Save summary
  // ==========================================

  meeting.summary =
    result.summary || "";

  await meeting.save();

  // ==========================================
  // DECISION TRACKING
  // ==========================================

  await Decision.deleteMany({
    meeting: meeting._id,
    user: userId,
  });

  const decisions = [];

  for (
    const item of result.decisions || []
  ) {
    const decisionText =
      (item.decision || "").trim();

    if (!decisionText) {
      continue;
    }

    const decision =
      await Decision.create({
        decision: decisionText,
        meeting: meeting._id,
        user: userId,
      });

    decisions.push(decision);
  }

  // ==========================================
  // ACTION ITEMS
  // ==========================================

  const existingActionItems =
    await ActionItem.find({
      meeting: meeting._id,
      user: userId,
    });

  const actionItems = [];

  const processedExistingIds =
    new Set();

  const processedNewTaskKeys =
    new Set();

  // ==========================================
  // Process AI action items
  // ==========================================

  for (
    const item of result.actionItems || []
  ) {
    const taskText =
      (item.task || "").trim();

    if (!taskText) {
      continue;
    }

    const taskKey =
      normalizeText(taskText);

    // ========================================
    // Prevent duplicate AI tasks
    // ========================================

    if (
      processedNewTaskKeys.has(taskKey)
    ) {
      continue;
    }

    processedNewTaskKeys.add(taskKey);

    // ==========================================
    // Find assignee
    // ==========================================

    const assigneeName =
      (item.assignee || "").trim();

    let assignedUser = null;

    if (
      assigneeName &&
      meeting.participants
    ) {
      const normalizedAssignee =
        assigneeName.toLowerCase();

      assignedUser =
        meeting.participants.find(
          (participant) => {
            const participantName =
              (
                participant.name || ""
              ).toLowerCase();

            const participantEmail =
              (
                participant.email || ""
              ).toLowerCase();

            return (
              participantName ===
                normalizedAssignee ||
              participantEmail ===
                normalizedAssignee
            );
          }
        );
    }

    // ==========================================
    // Find matching existing task
    // ==========================================

    const existingItem =
      findMatchingActionItem(
        existingActionItems.filter(
          (oldItem) =>
            !processedExistingIds.has(
              oldItem._id.toString()
            )
        ),
        taskText
      );

    // ==========================================
    // EXISTING TASK
    // ==========================================

    if (existingItem) {
      processedExistingIds.add(
        existingItem._id.toString()
      );

      existingItem.task =
        taskText;

      existingItem.assignee =
        assigneeName;

      existingItem.assigneeUser =
        assignedUser
          ? assignedUser._id
          : null;

      existingItem.dueDate =
        item.dueDate || null;

      // IMPORTANT:
      // Do NOT change existingItem.status.

      await existingItem.save();

      actionItems.push(
        existingItem
      );
    }

    // ==========================================
    // NEW TASK
    // ==========================================

    else {
      const newActionItem =
        await ActionItem.create({
          task: taskText,

          assignee:
            assigneeName,

          assigneeUser:
            assignedUser
              ? assignedUser._id
              : null,

          dueDate:
            item.dueDate || null,

          status: "pending",

          meeting:
            meeting._id,

          user:
            userId,
        });

      actionItems.push(
        newActionItem
      );
    }
  }

  // ==========================================
  // IMPORTANT:
  //
  // Do NOT delete old action items.
  // ==========================================

  return {
    meeting,
    summary:
      result.summary || "",
    decisions,
    actionItems,
  };
};

// ==========================================
// HTTP AI ANALYSIS ENDPOINT
// ==========================================

const analyzeMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await processMeetingWithAI(
        id,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Meeting analyzed successfully",
      summary:
        result.summary,
      decisions:
        result.decisions,
      actionItems:
        result.actionItems,
    });
  } catch (error) {
    console.error(
      "AI analysis error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid meeting ID",
      });
    }

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Server error during AI analysis",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  analyzeMeeting,
  processMeetingWithAI,
};