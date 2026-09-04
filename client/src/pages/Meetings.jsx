import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Meetings() {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feature 6: Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    meetingId: null,
    meetingTitle: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/meetings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setMeetings(data.meetings || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDeleteMeeting = (meetingId, meetingTitle) => {
    setDeleteModal({
      open: true,
      meetingId,
      meetingTitle,
    });
  };

  const confirmDeleteMeeting = async () => {
    const { meetingId } = deleteModal;

    if (!meetingId) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/meetings/${meetingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete meeting"
        );
      }

      setMeetings((prevMeetings) =>
        prevMeetings.filter(
          (meeting) => meeting._id !== meetingId
        )
      );

      setDeleteModal({
        open: false,
        meetingId: null,
        meetingTitle: "",
      });
    } catch (error) {
      console.error("Delete meeting error:", error);

      window.alert(
        error.message || "Failed to delete meeting"
      );
    }
  };
  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================
  // Feature 6: Search + Filter
  // =========================================

  const filteredMeetings = meetings.filter((meeting) => {
    const search = searchTerm.toLowerCase().trim();

    // Search title and description
    const matchesSearch =
      !search ||
      meeting.title?.toLowerCase().includes(search) ||
      meeting.description?.toLowerCase().includes(search);

    // Filter by meeting state
    let matchesFilter = true;

    if (activeFilter === "analyzed") {
      matchesFilter = Boolean(meeting.summary);
    }

    if (activeFilter === "not-analyzed") {
      matchesFilter = !meeting.summary;
    }

    if (activeFilter === "transcript") {
      matchesFilter = Boolean(meeting.transcript);
    }

    return matchesSearch && matchesFilter;
  });

  // Filter counts
  const analyzedCount = meetings.filter(
    (meeting) => meeting.summary
  ).length;

  const notAnalyzedCount = meetings.filter(
    (meeting) => !meeting.summary
  ).length;

  const transcriptCount = meetings.filter(
    (meeting) => meeting.transcript
  ).length;

  return (
    <div className="dashboard-page">

      {/* Sidebar */}
      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          MeetMind<span>AI</span>
        </div>

        <nav className="dashboard-nav">

          <button
            onClick={() => navigate("/dashboard")}
          >
            📊 Dashboard
          </button>

          <button className="active">
            📑 Meetings
          </button>

          <button
            onClick={() => navigate("/action-items")}
          >
            ✅ Action Items
          </button>

        </nav>

        <button
          className="dashboard-logout"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

      </aside>


      {/* Main Content */}
      <main className="dashboard-main">

        <div className="dashboard-header">

          <div>
            <p className="dashboard-label">
              MEETMIND AI
            </p>

            <h1>Meetings</h1>

            <p>
              View and manage all your meetings.
            </p>
          </div>

          <button
            className="dashboard-create-btn"
            onClick={() => navigate("/meetings/new")}
          >
            + New Meeting
          </button>

        </div>


        {/* =========================================
            Feature 6: Search
        ========================================= */}

        <div className="meeting-search-section">

          <div className="meeting-search-box">

            <span className="meeting-search-icon">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search meetings by title or description..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            {searchTerm && (
              <button
                className="meeting-search-clear"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ×
              </button>
            )}

          </div>

        </div>


        {/* =========================================
            Feature 6: Filters
        ========================================= */}

        <div className="meeting-filter-bar">

          <button
            className={
              activeFilter === "all"
                ? "meeting-filter active"
                : "meeting-filter"
            }
            onClick={() => setActiveFilter("all")}
          >
            All
            <span>{meetings.length}</span>
          </button>


          <button
            className={
              activeFilter === "analyzed"
                ? "meeting-filter active"
                : "meeting-filter"
            }
            onClick={() =>
              setActiveFilter("analyzed")
            }
          >
            🧠 AI Analyzed
            <span>{analyzedCount}</span>
          </button>


          <button
            className={
              activeFilter === "not-analyzed"
                ? "meeting-filter active"
                : "meeting-filter"
            }
            onClick={() =>
              setActiveFilter("not-analyzed")
            }
          >
            ⏳ Not Analyzed
            <span>{notAnalyzedCount}</span>
          </button>


          <button
            className={
              activeFilter === "transcript"
                ? "meeting-filter active"
                : "meeting-filter"
            }
            onClick={() =>
              setActiveFilter("transcript")
            }
          >
            📝 Transcript
            <span>{transcriptCount}</span>
          </button>

        </div>


        {/* =========================================
            Meetings Section
        ========================================= */}

        <section className="meetings-section">

          <div className="section-title">

            <div>

              <h2>
                {searchTerm
                  ? "Search Results"
                  : "All Meetings"}
              </h2>

              <p>
                {searchTerm
                  ? `Showing meetings matching "${searchTerm}"`
                  : "Your meeting notes and AI analysis."}
              </p>

            </div>

            <span className="meeting-count">
              {filteredMeetings.length}{" "}
              {filteredMeetings.length === 1
                ? "meeting"
                : "meetings"}
            </span>

          </div>


          {/* Loading */}
          {loading ? (

            <div className="dashboard-empty">
              <p>Loading meetings...</p>
            </div>

          ) : meetings.length === 0 ? (

            /* No meetings */
            <div className="dashboard-empty">

              <div>📅</div>

              <h3>No meetings yet</h3>

              <p>
                Create your first meeting to get started.
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  navigate("/meetings/new")
                }
              >
                Create Meeting
              </button>

            </div>

          ) : filteredMeetings.length === 0 ? (

            /* No search/filter results */
            <div className="dashboard-empty">

              <div>🔍</div>

              <h3>No meetings found</h3>

              <p>
                Try a different search term or filter.
              </p>

              <button
                className="primary-btn"
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilter("all");
                }}
              >
                Clear Search & Filters
              </button>

            </div>

          ) : (

            /* Meetings */
            <div className="meeting-list">

              {filteredMeetings.map((meeting) => (

                <div
                  className="dashboard-meeting-card"
                  key={meeting._id}
                >

                  {/* Card Top */}
                  <div className="meeting-card-top">

                    <div className="meeting-card-title">

                      <div className="meeting-card-icon">
                        📄
                      </div>

                      <div>

                        <h3>{meeting.title}</h3>

                        <p>
                          {meeting.description ||
                            "No description provided"}
                        </p>

                      </div>

                    </div>


                    <span className="meeting-status">
                      {meeting.summary
                        ? "✓ AI Analyzed"
                        : "Not Analyzed"}
                    </span>

                  </div>


                  {/* Card Bottom */}
                  <div className="meeting-card-bottom">

                    <span>
                      📅{" "}
                      {formatDate(meeting.createdAt)}
                    </span>

                    <span>
                      📝{" "}
                      {meeting.transcript
                        ? "Transcript available"
                        : "No transcript"}
                    </span>

                    <span>
                      🧠{" "}
                      {meeting.summary
                        ? "Summary available"
                        : "Ready for AI analysis"}
                    </span>

                  </div>


                  {/* Details Button */}
                  <div className="meeting-card-action">

                    <button
                      className="view-meeting-btn"
                      onClick={() =>
                        navigate(`/meetings/${meeting._id}`)
                      }
                    >
                      View Meeting Details →
                    </button>

                    <button
                      className="delete-meeting-btn"
                      onClick={() =>
                        handleDeleteMeeting(
                          meeting._id,
                          meeting.title
                        )
                      }
                    >
                      🗑️ Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

      {deleteModal.open && (
        <div className="delete-modal-overlay">

          <div className="delete-modal">

            <div className="delete-modal-icon">
              🗑️
            </div>

            <h2>Delete Meeting?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>"{deleteModal.meetingTitle}"</strong>?
            </p>

            <p className="delete-modal-warning">
              This will also permanently delete all action
              items associated with this meeting.
            </p>

            <div className="delete-modal-actions">

              <button
                className="delete-modal-cancel"
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    meetingId: null,
                    meetingTitle: "",
                  })
                }
              >
                Cancel
              </button>

              <button
                className="delete-modal-confirm"
                onClick={confirmDeleteMeeting}
              >
                🗑️ Delete Meeting
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Meetings;