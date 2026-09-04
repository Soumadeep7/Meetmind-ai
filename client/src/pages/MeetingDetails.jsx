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
        <div className="meeting-details-header">

          <div>

            <button
              className="back-button"
              onClick={() => navigate("/meetings")}
            >
              ← Back to Meetings
            </button>

            <div className="ai-eyebrow">
              MEETING DETAILS
            </div>

            <h1>{meeting.title}</h1>

            <p>
              {meeting.description ||
                "No description provided for this meeting."}
            </p>

          </div>

          <div className="meeting-details-actions">

            <button
              className="export-pdf-btn"
              onClick={exportMeetingPDF}
            >
              📄 Export PDF
            </button>

            <div className="meeting-date-card">
              <span>MEETING</span>

              <strong>
                {formatDate(meeting.createdAt)}
              </strong>
            </div>

          </div>

        </div>


        {/* SUMMARY */}
        <section className="details-card">

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


          {meeting.transcript ? (

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