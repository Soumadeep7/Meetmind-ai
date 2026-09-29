import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import API_URL from "../api";

function Decisions() {
  const navigate = useNavigate();

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchDecisions();
  }, [token, navigate]);

  // ==============================
  // Fetch Decisions
  // ==============================

  const fetchDecisions = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/decisions/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch decisions"
        );
      }

      setDecisions(data.decisions || []);
    } catch (error) {
      console.error("Fetch decisions error:", error);
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Logout
  // ==============================

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ==============================
  // Format Date
  // ==============================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ==============================
  // Search
  // ==============================

  const filteredDecisions = decisions.filter((item) => {
    const decisionText = (
      item.decision || ""
    ).toLowerCase();

    const meetingTitle = (
      item.meeting?.title || ""
    ).toLowerCase();

    const search = searchTerm.toLowerCase();

    return (
      decisionText.includes(search) ||
      meetingTitle.includes(search)
    );
  });

  return (
    <div className="ai-page">

      {/* ==============================
          Sidebar
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

          <button className="ai-nav-item active">
            <span>📌</span>
            Decisions
          </button>

        </nav>

        <button
          className="ai-logout"
          onClick={handleLogout}
        >
          <span>🚪</span>
          Logout
        </button>

      </aside>


      {/* ==============================
          Main Content
      ============================== */}

      <main className="ai-main">

        {/* Header */}

        <div className="ai-header">

          <div>

            <div className="ai-eyebrow">
              DECISION TRACKING
            </div>

            <h1>Decisions</h1>

            <p>
              Keep track of important decisions made
              across your meetings.
            </p>

          </div>

          <div className="ai-total">

            <strong>
              {decisions.length}
            </strong>

            <span>
              {decisions.length === 1
                ? "decision"
                : "decisions"}
            </span>

          </div>

        </div>


        {/* ==============================
            Search
        ============================== */}

        <div className="decisions-search-wrapper">

          <div className="decisions-search">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search decisions or meetings..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}

          </div>

        </div>


        {/* ==============================
            Section Header
        ============================== */}

        <div className="ai-section-header">

          <div>

            <h2>
              Key Decisions
            </h2>

            <p>
              Important decisions extracted from your meetings.
            </p>

          </div>

        </div>


        {/* ==============================
            Loading
        ============================== */}

        {loading && (
          <div className="ai-empty">

            <div className="ai-loading">
              ⏳
            </div>

            <h3>
              Loading decisions...
            </h3>

            <p>
              Fetching your meeting decisions.
            </p>

          </div>
        )}


        {/* ==============================
            Empty
        ============================== */}

        {!loading &&
          filteredDecisions.length === 0 && (
            <div className="ai-empty">

              <div className="ai-empty-icon">
                📌
              </div>

              <h3>
                {searchTerm
                  ? "No decisions found"
                  : "No decisions yet"}
              </h3>

              <p>
                {searchTerm
                  ? "Try a different search term."
                  : "Decisions extracted from your meetings will appear here."}
              </p>

              {searchTerm && (
                <button
                  className="ai-empty-button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  Clear Search
                </button>
              )}

            </div>
          )}


        {/* ==============================
            Decision List
        ============================== */}

        {!loading &&
          filteredDecisions.length > 0 && (

            <div className="decisions-list">

              {filteredDecisions.map((item, index) => (

                <div
                  className="decision-card"
                  key={item._id}
                >

                  {/* Icon */}

                  <div className="decision-card-icon">
                    📌
                  </div>


                  {/* Content */}

                  <div className="decision-card-content">

                    <span className="decision-card-label">
                      DECISION
                    </span>

                    <p className="decision-card-text">
                      {item.decision}
                    </p>


                    <div className="decision-card-meta">

                      <span>
                        📄{" "}
                        {item.meeting?.title ||
                          "Unknown meeting"}
                      </span>

                      <span>
                        🗓️{" "}
                        {formatDate(item.createdAt)}
                      </span>

                    </div>

                  </div>


                  {/* View Meeting */}

                  <button
                    className="decision-card-button"
                    onClick={() =>
                      navigate(
                        `/meetings/${item.meeting?._id}`
                      )
                    }
                  >
                    View Meeting →
                  </button>

                </div>

              ))}

            </div>
          )}

      </main>

    </div>
  );
}

export default Decisions;