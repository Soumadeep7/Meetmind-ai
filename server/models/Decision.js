const mongoose = require("mongoose");

const decisionSchema = new mongoose.Schema(
  {
    decision: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Decision = mongoose.model("Decision", decisionSchema);

module.exports = Decision;