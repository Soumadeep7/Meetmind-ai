import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import API_URL from "../api";

const CreateMeeting = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const [transcript, setTranscript] = useState("");

  const [meetingId, setMeetingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      setError("");
      setMessage("");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const file = new File(
          [audioBlob],
          "meeting-recording.webm",
          {
            type: "audio/webm",
          }
        );

        setAudioFile(file);

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => {
          track.stop();
        });
      };

      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((time) => time + 1);
      }, 1000);

    } catch (err) {
      console.error(err);

      setError(
        "Microphone permission is required to record audio."
      );
    }
  };
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    clearInterval(timerRef.current);

    setIsRecording(false);
  };

  const searchUsers = async (search = "") => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setLoadingUsers(true);

      const response = await fetch(
        `${API_URL}/api/users/search?search=${encodeURIComponent(
          search
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error("User search error:", err);
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    searchUsers();
  }, []);
  // ==============================
  // CREATE MEETING
  // ==============================
  const handleCreateMeeting = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/meetings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            participants: selectedParticipants,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create meeting"
        );
      }

      setMeetingId(data.meeting._id);
      setMessage("Meeting created successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // TRANSCRIBE AUDIO
  // ==============================
  const handleTranscribe = async () => {
    if (!audioFile) {
      setError("Please select an audio file first.");
      return;
    }

    if (!meetingId) {
      setError("Please create the meeting first.");
      return;
    }

    setTranscribing(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await fetch(
        `${API_URL}/api/transcription/meetings/${meetingId}/transcribe`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Transcription failed"
        );
      }

      setTranscript(data.transcript);
      setMessage("Audio transcribed successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setTranscribing(false);
    }
  };

  // ==============================
  // AI ANALYSIS
  // ==============================
  const handleAnalyze = async () => {
    if (!meetingId) {
      setError("Please create the meeting first.");
      return;
    }

    if (!transcript.trim()) {
      setError("Please enter or generate a transcript first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // ==========================================
      // STEP 1: Save transcript to the meeting
      // ==========================================
      const updateResponse = await fetch(
        `${API_URL}/api/meetings/${meetingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transcript: transcript.trim(),
          }),
        }
      );

      const updateData = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(
          updateData.message || "Failed to save transcript"
        );
      }

      // ==========================================
      // STEP 2: Send meeting to AI
      // ==========================================
      setMessage("Transcript saved. Analyzing meeting with AI...");

      const response = await fetch(
        `${API_URL}/api/ai/meetings/${meetingId}/analyze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "AI analysis failed"
        );
      }

      // ==========================================
      // STEP 3: Success
      // ==========================================
      setMessage("Meeting analyzed successfully!");

      setTimeout(() => {
        navigate("/action-items");
      }, 1000);

    } catch (err) {
      console.error("AI analysis error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="ai-page">

      {/* ==============================
          SIDEBAR
      ============================== */}
      <aside className="ai-sidebar">

        <div className="ai-logo">
          MeetMind<span>AI</span>
        </div>

        <nav className="ai-nav">

          <button
            className="ai-nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>📊</span>
            Dashboard
          </button>

          <button
            className="ai-nav-item"
            onClick={() => navigate("/meetings")}
          >
            <span>📄</span>
            Meetings
          </button>

          <button
            className="ai-nav-item"
            onClick={() => navigate("/action-items")}
          >
            <span>✅</span>
            Action Items
          </button>

          <button
            className="ai-nav-item"
            onClick={() => navigate("/decisions")}
          >
            <span>📌</span>
            Decisions
          </button>

        </nav>

        <button
          className="ai-logout"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          <span>🚪</span>
          Logout
        </button>

      </aside>


      {/* ==============================
          MAIN CONTENT
      ============================== */}
      <main className="ai-main create-meeting-main">

        {/* Header */}
        <div className="ai-header create-meeting-header">

          <div>

            <div className="ai-eyebrow">
              MEETMIND AI
            </div>

            <h1>Create New Meeting</h1>

            <p>
              Upload your meeting recording and turn it
              into actionable insights.
            </p>

          </div>

          <button
            className="back-button"
            onClick={() => navigate("/meetings")}
          >
            ← Back to Meetings
          </button>

        </div>


        {/* Messages */}
        {message && (
          <div className="create-message success-message">
            <span>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="create-message error-message">
            <span>!</span>
            {error}
          </div>
        )}


        {/* ==============================
            MEETING INFORMATION
        ============================== */}
        <section className="create-card">

          <div className="create-card-header">

            <div className="create-card-icon">
              📋
            </div>

            <div>
              <h2>Meeting Information</h2>

              <p>
                Start by providing some basic information
                about your meeting.
              </p>
            </div>

          </div>


          <form onSubmit={handleCreateMeeting}>

            <div className="create-form-group">

              <label>
                Meeting Title
                <span>*</span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Project Meeting"
                required
                disabled={!!meetingId}
              />

            </div>


            <div className="create-form-group">

              <label>Description</label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="What was this meeting about?"
                rows="4"
                disabled={!!meetingId}
              />

            </div>

            <div className="create-form-group">

              <label>
                Participants
              </label>

              {!meetingId && (
                <>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      const value = e.target.value;

                      setUserSearch(value);
                      searchUsers(value);
                    }}
                    placeholder="Search participants by name or email..."
                  />

                  <div className="participant-list">

                    {loadingUsers ? (
                      <p className="participant-loading">
                        Loading users...
                      </p>
                    ) : users.length === 0 ? (
                      <p className="participant-empty">
                        No users found.
                      </p>
                    ) : (
                      users.map((user) => {
                        const isSelected =
                          selectedParticipants.includes(user._id);

                        return (
                          <label
                            key={user._id}
                            className={`participant-item ${isSelected ? "selected" : ""
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedParticipants((current) => {
                                  if (current.includes(user._id)) {
                                    return current.filter(
                                      (id) => id !== user._id
                                    );
                                  }

                                  return [...current, user._id];
                                });
                              }}
                            />

                            <div className="participant-info">
                              <strong>{user.name}</strong>
                              <span>{user.email}</span>
                            </div>
                          </label>
                        );
                      })
                    )}

                  </div>

                  <p className="participant-count">
                    {selectedParticipants.length} participant
                    {selectedParticipants.length !== 1 ? "s" : ""} selected
                  </p>
                </>
              )}

            </div>


            {!meetingId ? (
              <button
                type="submit"
                className="create-primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Creating Meeting..."
                  : "Create Meeting →"}
              </button>
            ) : (
              <div className="created-status">
                <span>✓</span>
                Meeting Created
              </div>
            )}

          </form>

        </section>


        {/* ==============================
            AUDIO UPLOAD
        ============================== */}
        {meetingId && (
          <section className="create-card">

            <div className="create-card-header">

              <div className="create-card-icon audio-icon">
                🎙️
              </div>

              <div>
                <h2>Meeting Audio</h2>

                <p>
                  Upload your recording and let Whisper
                  automatically generate the transcript.
                </p>
              </div>

            </div>


            <div className="audio-upload-box">

              {!isRecording && !audioFile && (
                <>
                  <div className="audio-upload-icon">
                    🎙️
                  </div>

                  <h3>
                    Record or upload your meeting
                  </h3>

                  <p>
                    Record directly from your microphone or
                    upload an existing recording.
                  </p>

                  <div className="audio-actions">

                    <button
                      type="button"
                      className="record-btn"
                      onClick={startRecording}
                    >
                      🔴 Start Recording
                    </button>

                    <span className="audio-or">
                      OR
                    </span>

                    <label className="file-select-btn">
                      📁 Choose Audio File

                      <input
                        type="file"
                        accept=".mp3,.wav,.m4a,.webm,audio/*"
                        onChange={(e) => {
                          setAudioFile(e.target.files[0]);
                          setAudioUrl(null);
                          setError("");
                          setMessage("");
                        }}
                      />
                    </label>

                  </div>
                </>
              )}


              {isRecording && (
                <div className="recording-active">

                  <div className="recording-circle">
                    🎙️
                  </div>

                  <h3>
                    Recording in progress...
                  </h3>

                  <div className="recording-time">
                    {formatRecordingTime(recordingTime)}
                  </div>

                  <button
                    type="button"
                    className="stop-record-btn"
                    onClick={stopRecording}
                  >
                    ⏹ Stop Recording
                  </button>

                </div>
              )}


              {!isRecording && audioFile && (
                <div className="recording-complete">

                  <div className="audio-file-icon">
                    🎵
                  </div>

                  <div className="recording-file-info">

                    <strong>
                      {audioFile.name}
                    </strong>

                    <small>
                      {(audioFile.size / (1024 * 1024)).toFixed(2)}
                      {" MB"}
                    </small>

                  </div>

                  {audioUrl && (
                    <audio
                      controls
                      src={audioUrl}
                      className="audio-player"
                    />
                  )}

                  <button
                    type="button"
                    className="change-audio-btn"
                    onClick={() => {
                      setAudioFile(null);
                      setAudioUrl(null);
                    }}
                  >
                    Change
                  </button>

                </div>
              )}

            </div>


            <button
              type="button"
              className="transcribe-btn"
              onClick={handleTranscribe}
              disabled={
                transcribing || !audioFile
              }
            >
              {transcribing
                ? "⏳ Transcribing Audio..."
                : "🎙️ Transcribe Audio"}
            </button>

          </section>
        )}


        {/* ==============================
            MANUAL TRANSCRIPT / TRANSCRIPT
          ============================== */}
        {meetingId && (
          <section className="create-card">

            <div className="create-card-header">

              <div className="create-card-icon transcript-icon">
                📝
              </div>

              <div>
                <h2>Meeting Transcript</h2>

                <p>
                  Paste an existing transcript or use the transcript
                  generated from your meeting audio.
                </p>
              </div>

            </div>

            <div className="transcript-container">

              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="Paste or type your meeting transcript here..."
                rows="12"
              />

              <div className="transcript-footer">

                <span>
                  {transcript
                    ? "✓ Transcript ready for AI analysis"
                    : "Enter your transcript to continue"}
                </span>

                <span>
                  {transcript.length} characters
                </span>

              </div>

            </div>

            <div className="analysis-box">

              <div>
                <h3>
                  🤖 AI Meeting Analysis
                </h3>

                <p>
                  MeetMind AI will generate a summary and extract
                  actionable tasks from your transcript.
                </p>
              </div>

              <button
                type="button"
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={loading || !transcript.trim()}
              >
                {loading
                  ? "🤖 Analyzing..."
                  : "🤖 Analyze Meeting"}
              </button>

            </div>

          </section>
        )}

      </main>

    </div>
  );
};

export default CreateMeeting;