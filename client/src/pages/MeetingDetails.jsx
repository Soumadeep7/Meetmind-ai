import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import "../App.css";

const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decisions, setDecisions] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    transcript: "",
  });

  useEffect(() => {
    fetchMeetingDetails();
  }, [id]);

  const fetchMeetingDetails = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Get meeting
      const meetingResponse = await fetch(
        `http://localhost:5000/api/meetings/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const meetingData = await meetingResponse.json();

      if (!meetingResponse.ok) {
        throw new Error(
          meetingData.message || "Failed to fetch meeting"
        );
      }

      const currentMeeting =
        meetingData.meeting || meetingData.data;

      setMeeting(currentMeeting);

      // Get action items
      const actionResponse = await fetch(
        `http://localhost:5000/api/action-items/meeting/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const decisionResponse = await fetch(
        `http://localhost:5000/api/decisions/meeting/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const decisionData = await decisionResponse.json();

      if (!decisionResponse.ok) {
        throw new Error(
          decisionData.message || "Failed to fetch decisions"
        );
      }

      setDecisions(decisionData.decisions || []);

      const actionData = await actionResponse.json();

      if (actionResponse.ok) {
        setActionItems(
          actionData.actionItems ||
          actionData.data ||
          []
        );
      }

    } catch (err) {
      console.error("Meeting details error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setSaveMessage("");
    setSaveError("");

    setEditForm({
      title: meeting.title || "",
      description: meeting.description || "",
      transcript: meeting.transcript || "",
    });

    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);

    setEditForm({
      title: meeting.title || "",
      description: meeting.description || "",
      transcript: meeting.transcript || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveChanges = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setSaveMessage("");
    setSaveError("");

    if (!editForm.title.trim()) {
      setSaveError("Meeting title is required.");
      return;
    }

    try {
      setSavingChanges(true);

      const response = await fetch(
        `http://localhost:5000/api/meetings/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editForm.title.trim(),
            description: editForm.description.trim(),
            transcript: editForm.transcript,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update meeting"
        );
      }

      setMeeting(data.meeting);

      setIsEditing(false);

      setSaveMessage("Meeting updated successfully.");
    } catch (error) {
      console.error("Update meeting error:", error);

      setSaveError(
        error.message || "Failed to update meeting"
      );
    } finally {
      setSavingChanges(false);
    }
  };
  const reAnalyzeMeeting = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!meeting.transcript?.trim()) {
      setSaveError(
        "A meeting transcript is required before AI analysis."
      );
      return;
    }

    try {
      setReanalyzing(true);
      setSaveMessage("");
      setSaveError("");

      const response = await fetch(
        `http://localhost:5000/api/ai/meetings/${id}/analyze`,
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
          data.message || "Failed to analyze meeting"
        );
      }

      // Update summary immediately
      setMeeting((prev) => ({
        ...prev,
        summary: data.summary || "",
      }));

      // Fetch newly generated action items
      const actionResponse = await fetch(
        `http://localhost:5000/api/action-items/meeting/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const actionData = await actionResponse.json();

      if (actionResponse.ok) {
        setActionItems(
          actionData.actionItems ||
          actionData.data ||
          []
        );
      }

      // Fetch newly generated decisions
      const decisionResponse = await fetch(
        `http://localhost:5000/api/decisions/meeting/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const decisionData = await decisionResponse.json();

      if (decisionResponse.ok) {
        setDecisions(
          decisionData.decisions || []
        );
      }

      setSaveMessage(
        "Meeting re-analyzed successfully. AI summary, action items, and decisions have been updated."
      );
    } catch (error) {
      console.error("Re-analysis error:", error);

      setSaveError(
        error.message || "Failed to re-analyze meeting"
      );
    } finally {
      setReanalyzing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    if (status === "in-progress") return "In Progress";

    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Pending";
  };

  const exportMeetingPDF = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let y = 20;

    const addWrappedText = (
      text,
      x,
      startY,
      maxWidth,
      lineHeight = 7
    ) => {
      const lines = doc.splitTextToSize(
        String(text || ""),
        maxWidth
      );

      let currentY = startY;

      lines.forEach((line) => {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        doc.text(line, x, currentY);
        currentY += lineHeight;
      });

      return currentY;
    };

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MeetMind AI", margin, y);

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Meeting Notes & AI Analysis", margin, y);

    y += 15;

    // Meeting Information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Meeting Information", margin, y);

    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Title:", margin, y);

    doc.setFont("helvetica", "normal");

    y = addWrappedText(
      meeting.title,
      margin + 25,
      y,
      contentWidth - 25
    );

    y += 3;

    doc.setFont("helvetica", "bold");
    doc.text("Date:", margin, y);

    doc.setFont("helvetica", "normal");

    doc.text(
      formatDate(meeting.createdAt),
      margin + 25,
      y
    );

    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Description:", margin, y);

    y += 7;

    doc.setFont("helvetica", "normal");

    y = addWrappedText(
      meeting.description || "No description provided.",
      margin,
      y,
      contentWidth
    );

    y += 10;

    // AI Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("AI Summary", margin, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    y = addWrappedText(
      meeting.summary || "No AI summary available.",
      margin,
      y,
      contentWidth
    );

    y += 10;

    // Action Items
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Action Items", margin, y);

    y += 10;

    if (actionItems.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      y = addWrappedText(
        "No action items were extracted from this meeting.",
        margin,
        y,
        contentWidth
      );
    } else {
      actionItems.forEach((item, index) => {
        if (y > pageHeight - 70) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);

        y = addWrappedText(
          `${index + 1}. ${item.task}`,
          margin,
          y,
          contentWidth
        );

        y += 2;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        y = addWrappedText(
          `Assigned to: ${item.assignee || "Unassigned"
          }`,
          margin + 5,
          y,
          contentWidth - 5
        );

        y = addWrappedText(
          `Due date: ${formatDate(item.dueDate)}`,
          margin + 5,
          y,
          contentWidth - 5
        );

        y = addWrappedText(
          `Status: ${getStatusLabel(item.status)}`,
          margin + 5,
          y,
          contentWidth - 5
        );

        y += 7;
      });
    }

    // Transcript
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Meeting Transcript", margin, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    addWrappedText(
      meeting.transcript || "No transcript available.",
      margin,
      y,
      contentWidth,
      6
    );

    // Footer
    const totalPages = doc.internal.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(
        `MeetMind AI • Page ${page} of ${totalPages}`,
        margin,
        pageHeight - 10
      );
    }

    // Download
    const safeTitle = meeting.title
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_");

    doc.save(`${safeTitle}_Meeting_Notes.pdf`);
  };

  if (loading) {
    return (
      <div className="ai-page">
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
              className="ai-nav-item active"
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
              onClick={() => navigate("/decisions")}
            >
              📌 Decisions
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

        <main className="ai-main">
          <div className="meeting-details-loading">
            Loading meeting...
          </div>
        </main>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="ai-page">
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
              className="ai-nav-item active"
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
          </nav>
        </aside>

        <main className="ai-main">
          <div className="meeting-details-error">
            <h2>Unable to load meeting</h2>
            <p>{error || "Meeting not found."}</p>

            <button
              className="create-primary-btn"
              onClick={() => navigate("/meetings")}
            >
              ← Back to Meetings
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ai-page">

      {/* SIDEBAR */}
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
            className="ai-nav-item active"
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


      {/* MAIN */}
      <main className="ai-main meeting-details-main">

        {/* HEADER */}
        <div className="meeting-details-header modern-meeting-header">

          <div className="meeting-details-header-content">

            <button
              className="back-button"
              onClick={() => navigate("/meetings")}
            >
              ← Back to Meetings
            </button>

            <div className="ai-eyebrow">
              MEETING
            </div>

            {isEditing ? (
              <div className="meeting-edit-header-form">

                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="meeting-edit-title-input"
                  placeholder="Meeting title"
                />

                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="meeting-edit-description-input"
                  placeholder="Meeting description"
                  rows="3"
                />

              </div>
            ) : (
              <>
                <h1>{meeting.title}</h1>

                <p>
                  {meeting.description ||
                    "No description provided for this meeting."}
                </p>

                <div className="meeting-meta-row">

                  <span>
                    📅 {formatDate(meeting.createdAt)}
                  </span>

                  <span>
                    👥 {meeting.participants?.length || 0} participants
                  </span>

                  <span className="meeting-ai-status">
                    🤖 {meeting.summary ? "AI analyzed" : "Not analyzed"}
                  </span>

                </div>
              </>
            )}

          </div>

          <div className="meeting-details-actions">

            {isEditing ? (
              <>
                <button
                  className="edit-cancel-btn"
                  onClick={cancelEditing}
                  disabled={savingChanges}
                >
                  Cancel
                </button>

                <button
                  className="edit-save-btn"
                  onClick={saveChanges}
                  disabled={savingChanges}
                >
                  {savingChanges
                    ? "Saving..."
                    : "💾 Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  className="edit-meeting-btn"
                  onClick={startEditing}
                >
                  ✏️ Edit Meeting
                </button>

                <button
                  className="reanalyze-meeting-btn"
                  onClick={reAnalyzeMeeting}
                  disabled={
                    reanalyzing ||
                    !meeting.transcript?.trim()
                  }
                >
                  {reanalyzing
                    ? "🔄 Analyzing..."
                    : "🔄 Re-analyze"}
                </button>

                <button
                  className="export-pdf-btn"
                  onClick={exportMeetingPDF}
                >
                  📄 Export PDF
                </button>
              </>
            )}

          </div>

        </div>

        {saveMessage && (
          <div className="meeting-save-message success">
            ✓ {saveMessage}
          </div>
        )}

        {saveError && (
          <div className="meeting-save-message error">
            ⚠ {saveError}
          </div>
        )}

        {/* SUMMARY */}
        <section className="details-card modern-summary-card">

          <div className="details-card-header">

            <div className="details-icon">
              🤖
            </div>

            <div>
              <h2>AI Summary</h2>
              <p>
                Automatically generated meeting summary.
              </p>
            </div>

          </div>

          <div className="summary-content">
            {meeting.summary ? (
              <p>{meeting.summary}</p>
            ) : (
              <div className="no-summary">
                <span>💡</span>

                <div>
                  <strong>No AI summary yet</strong>
                  <p>
                    Analyze this meeting to generate an
                    AI-powered summary.
                  </p>
                </div>
              </div>
            )}
          </div>

        </section>

        <div className="meeting-details-section">

          <div className="meeting-details-section-header">

            <div>
              <span className="meeting-details-section-label">
                DECISION TRACKING
              </span>

              <h2>Key Decisions</h2>
            </div>

            <span className="decision-count">
              {decisions.length}
            </span>

          </div>

          {decisions.length === 0 ? (

            <div className="decision-empty-state">
              <div className="decision-empty-icon">
                📌
              </div>

              <h3>No decisions recorded</h3>

              <p>
                Important decisions from this meeting will appear here
                after AI analysis.
              </p>
            </div>

          ) : (

            <div className="decisions-list">

              {decisions.map((item, index) => (

                <div
                  className="decision-card"
                  key={item._id}
                >

                  <div className="decision-number">
                    {index + 1}
                  </div>

                  <div className="decision-content">

                    <span>DECISION</span>

                    <p>
                      {item.decision}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* ACTION ITEMS */}
        <section className="details-card">

          <div className="details-card-header">

            <div className="details-icon action-details-icon">
              ✅
            </div>

            <div>
              <h2>Action Items</h2>
              <p>
                Tasks extracted from this meeting.
              </p>
            </div>

            <div className="details-count">
              {actionItems.length}
            </div>

          </div>


          {actionItems.length === 0 ? (

            <div className="details-empty">
              <div>📋</div>
              <h3>No action items yet</h3>
              <p>
                Analyze this meeting with AI to extract
                actionable tasks.
              </p>
            </div>

          ) : (

            <div className="details-action-list">

              {actionItems.map((item) => (

                <div
                  className="details-action-item"
                  key={item._id}
                >

                  <div className="details-action-check">
                    {item.status === "completed"
                      ? "✓"
                      : "○"}
                  </div>

                  <div className="details-action-content">

                    <h3>{item.task}</h3>

                    <div className="details-action-meta">

                      <span>
                        👤 {item.assignee || "Unassigned"}
                      </span>

                      <span>
                        📅 {formatDate(item.dueDate)}
                      </span>

                    </div>

                  </div>

                  <div
                    className={`details-status status-${item.status}`}
                  >
                    {getStatusLabel(item.status)}
                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* TRANSCRIPT */}
        <section className="details-card">

          <div className="details-card-header">

            <div className="details-icon transcript-details-icon">
              📝
            </div>

            <div>
              <h2>Meeting Transcript</h2>
              <p>
                Full transcript used for AI analysis.
              </p>
            </div>

          </div>


          {isEditing ? (

            <div className="meeting-edit-transcript">

              <textarea
                name="transcript"
                value={editForm.transcript}
                onChange={handleEditChange}
                className="meeting-transcript-editor"
                placeholder="Enter or edit the meeting transcript..."
                rows="12"
              />

              <p className="meeting-edit-hint">
                You can edit the transcript before re-analyzing the meeting.
              </p>

            </div>

          ) : meeting.transcript ? (

            <div className="details-transcript">
              {meeting.transcript}
            </div>

          ) : (

            <div className="details-empty">
              <div>📝</div>

              <h3>No transcript available</h3>

              <p>
                Upload or record meeting audio to generate
                a transcript.
              </p>
            </div>

          )}
        </section>

      </main>

    </div>
  );
};

export default MeetingDetails;