const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const Meeting = require("../models/Meeting");

const transcribeMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    // Check audio file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    // Find meeting
    const meeting = await Meeting.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!meeting) {
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Python executable inside Whisper virtual environment
    const pythonPath = path.join(
      __dirname,
      "..",
      "whisper-env",
      "Scripts",
      "python.exe"
    );

    // Python transcription script
    const scriptPath = path.join(
      __dirname,
      "..",
      "transcribe.py"
    );

    console.log("Starting Whisper transcription...");

    const pythonProcess = spawn(
      pythonPath,
      [scriptPath, req.file.path],
      {
        windowsHide: true,
      }
    );

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.log("Whisper:", data.toString());
    });

    pythonProcess.on("close", async (code) => {
      try {
        // Delete uploaded audio after transcription
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        if (code !== 0) {
          console.error("Whisper error:", errorOutput);

          return res.status(500).json({
            success: false,
            message: "Transcription failed",
            error: errorOutput,
          });
        }

        const result = JSON.parse(output);

        if (!result.success) {
          return res.status(500).json({
            success: false,
            message: "Transcription failed",
            error: result.error,
          });
        }

        // Save transcript in MongoDB
        meeting.transcript = result.transcript.trim();

        await meeting.save();

        return res.status(200).json({
          success: true,
          message: "Audio transcribed successfully",
          transcript: meeting.transcript,
          language: result.language,
        });
      } catch (error) {
        console.error("Transcription processing error:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to process transcription",
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Transcription controller error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  transcribeMeeting,
};