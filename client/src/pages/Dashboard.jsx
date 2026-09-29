import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import API_URL from "../api";

function Dashboard() {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ==============================
      // Get meetings
      // ==============================

      const meetingsResponse = await fetch(
        `${API_URL}/api/meetings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const meetingsData = await meetingsResponse.json();

      if (!meetingsResponse.ok) {
        console.error(meetingsData.message);
        return;
      }

      const userMeetings = meetingsData.meetings || [];

      setMeetings(userMeetings);

      // ==============================
      // Get my action items
      // ==============================

      const actionResponse = await fetch(
        `${API_URL}/api/action-items/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const actionData = await actionResponse.json();

      if (!actionResponse.ok) {
        console.error(actionData.message);
        return;
      }

      setActionItems(actionData.actionItems || []);

      setActionItems(allActionItems);
    } catch (error) {
      console.error("Dashboard error:", error);
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
  // New Meeting
  // ==============================

  const handleNewMeeting = () => {
    navigate("/meetings/new");
  };

  // ==============================
  // Statistics
  // ==============================

  const analyzedMeetings = meetings.filter(
    (meeting) => meeting.summary
  ).length;

  const pendingTasks = actionItems.filter(
    (item) => item.status === "pending"
  ).length;

  const inProgressTasks = actionItems.filter(
    (item) => item.status === "in-progress"
  ).length;

  const completedTasks = actionItems.filter(
    (item) => item.status === "completed"
  ).length;

  // ==============================
  // Overdue Tasks
  // ==============================

  const overdueTasks = actionItems.filter((item) => {
    if (!item.dueDate || item.status === "completed") {
      return false;
    }

    const today = new Date();
    const dueDate = new Date(item.dueDate);

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  }).length;

  // ==============================
  // Recent Meetings
  // ==============================

  const recentMeetings = [...meetings]
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .slice(0, 5);

  // ==============================
  // Action item percentage
  // ==============================

  const totalTasks = actionItems.length;

  const getPercentage = (count) => {
    if (totalTasks === 0) {
      return 0;
    }

    return Math.round((count / totalTasks) * 100);
  };

  return (
    <div className="dashboard-page">

      {/* ==============================
          Sidebar
      ============================== */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          MeetMind<span>AI</span>
        </div>

        <nav className="dashboard-nav">

          <button className="active">
            📊 Dashboard
          </button>

          <button
            onClick={() => navigate("/meetings")}
          >
            📝 Meetings
          </button>

          <button
            onClick={() => navigate("/action-items")}
          >
            ✅ Action Items
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
          className="dashboard-logout"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* ==============================
          Main Content
      ============================== */}

      <main className="dashboard-main">

        {/* Header */}

        <div className="dashboard-header">

          <div>

            <p className="dashboard-label">
              MEETMIND AI
            </p>

            <h1>Dashboard</h1>

            <p>
              Manage your meetings and stay on top of
              your action items.
            </p>

          </div>

          <button
            className="dashboard-create-btn"
            onClick={handleNewMeeting}
          >
            + New Meeting
          </button>

        </div>

        {/* ==============================
            Statistics
        ============================== */}

        <div className="dashboard-stats">

          {/* Total Meetings */}

          <div className="stat-card">

            <div className="stat-icon">
              📅
            </div>

            <div>
              <p>Total Meetings</p>
              <h2>{meetings.length}</h2>
            </div>

          </div>

          {/* AI Analyzed */}

          <div className="stat-card">

            <div className="stat-icon">
              🧠
            </div>

            <div>
              <p>AI Analyzed</p>
              <h2>{analyzedMeetings}</h2>
            </div>

          </div>

          {/* Action Items */}

          <div className="stat-card">

            <div className="stat-icon">
              📋
            </div>

            <div>
              <p>Action Items</p>
              <h2>{totalTasks}</h2>
            </div>

          </div>

          {/* Pending */}

          <div className="stat-card">

            <div className="stat-icon">
              ⏳
            </div>

            <div>
              <p>Pending</p>
              <h2>{pendingTasks}</h2>
            </div>

          </div>

          {/* In Progress */}

          <div className="stat-card">

            <div className="stat-icon">
              🔄
            </div>

            <div>
              <p>In Progress</p>
              <h2>{inProgressTasks}</h2>
            </div>

          </div>

          {/* Completed */}

          <div className="stat-card">

            <div className="stat-icon">
              ✅
            </div>

            <div>
              <p>Completed</p>
              <h2>{completedTasks}</h2>
            </div>

          </div>

          {/* Overdue */}

          <div className="stat-card dashboard-overdue-card">

            <div className="stat-icon">
              🔴
            </div>

            <div>
              <p>Overdue</p>
              <h2>{overdueTasks}</h2>
            </div>

          </div>

        </div>

        {/* ==============================
            Analytics Section
        ============================== */}

        <div className="dashboard-analytics">

          {/* Action Item Overview */}

          <section className="analytics-card">

            <div className="analytics-header">

              <div>
                <h2>Action Item Overview</h2>

                <p>
                  Current status of your action items.
                </p>
              </div>

              <span className="analytics-total">
                {totalTasks} total
              </span>

            </div>

            {totalTasks === 0 ? (

              <div className="analytics-empty">
                <span>📋</span>
                <p>No action items yet.</p>
              </div>

            ) : (

              <div className="progress-list">

                {/* Pending */}

                <div className="progress-row">

                  <div className="progress-label">

                    <span>
                      <span className="progress-dot pending-dot"></span>
                      Pending
                    </span>

                    <strong>
                      {pendingTasks} ({getPercentage(pendingTasks)}%)
                    </strong>

                  </div>

                  <div className="progress-track">

                    <div
                      className="progress-fill pending-fill"
                      style={{
                        width: `${getPercentage(
                          pendingTasks
                        )}%`,
                      }}
                    ></div>

                  </div>

                </div>

                {/* In Progress */}

                <div className="progress-row">

                  <div className="progress-label">

                    <span>
                      <span className="progress-dot progress-dot-color"></span>
                      In Progress
                    </span>

                    <strong>
                      {inProgressTasks} (
                      {getPercentage(inProgressTasks)}
                      %)
                    </strong>

                  </div>

                  <div className="progress-track">

                    <div
                      className="progress-fill progress-fill-color"
                      style={{
                        width: `${getPercentage(
                          inProgressTasks
                        )}%`,
                      }}
                    ></div>

                  </div>

                </div>

                {/* Completed */}

                <div className="progress-row">

                  <div className="progress-label">

                    <span>
                      <span className="progress-dot completed-dot"></span>
                      Completed
                    </span>

                    <strong>
                      {completedTasks} (
                      {getPercentage(completedTasks)}
                      %)
                    </strong>

                  </div>

                  <div className="progress-track">

                    <div
                      className="progress-fill completed-fill"
                      style={{
                        width: `${getPercentage(
                          completedTasks
                        )}%`,
                      }}
                    ></div>

                  </div>

                </div>

              </div>

            )}

          </section>

          {/* Meeting Analytics */}

          <section className="analytics-card">

            <div className="analytics-header">

              <div>
                <h2>Meeting Analytics</h2>

                <p>
                  AI processing progress.
                </p>
              </div>

            </div>

            <div className="meeting-analytics-list">

              <div className="meeting-analytics-item">

                <div>
                  <span>All Meetings</span>
                  <strong>{meetings.length}</strong>
                </div>

                <span className="analytics-icon">
                  📅
                </span>

              </div>

              <div className="meeting-analytics-item">

                <div>
                  <span>AI Analyzed</span>
                  <strong>{analyzedMeetings}</strong>
                </div>

                <span className="analytics-icon">
                  🧠
                </span>

              </div>

              <div className="meeting-analytics-item">

                <div>
                  <span>Awaiting Analysis</span>
                  <strong>
                    {meetings.length -
                      analyzedMeetings}
                  </strong>
                </div>

                <span className="analytics-icon">
                  ⏱️
                </span>

              </div>

            </div>

          </section>

        </div>

        {/* ==============================
            Recent Meetings
        ============================== */}

        <section className="meetings-section">

          <div className="section-title">

            <div>

              <h2>
                Recent Meetings
              </h2>

              <p>
                Your latest meeting notes and AI analysis.
              </p>

            </div>

            <button
              className="dashboard-view-all"
              onClick={() => navigate("/meetings")}
            >
              View All →
            </button>

          </div>

          {/* Loading */}

          {loading ? (

            <div className="dashboard-empty">
              <p>Loading dashboard...</p>
            </div>

          ) : recentMeetings.length === 0 ? (

            <div className="dashboard-empty">

              <div>📅</div>

              <h3>
                No meetings yet
              </h3>

              <p>
                Create your first meeting to get started.
              </p>

              <button
                className="dashboard-create-btn"
                onClick={handleNewMeeting}
              >
                + Create Meeting
              </button>

            </div>

          ) : (

            <div className="meeting-list">

              {recentMeetings.map((meeting) => (

                <div
                  className="dashboard-meeting-card"
                  key={meeting._id}
                >

                  <div className="meeting-card-top">

                    <div>

                      <h3>
                        {meeting.title}
                      </h3>

                      <p>
                        {meeting.description ||
                          "No description provided"}
                      </p>

                    </div>

                    <span className="meeting-status">

                      {meeting.summary
                        ? "✓ AI Analyzed"
                        : "Not Analyzed"}

                    </span>

                  </div>

                  <div className="meeting-card-bottom">

                    <span>
                      🧠{" "}
                      {meeting.summary
                        ? "Summary available"
                        : "Ready for AI analysis"}
                    </span>

                    <span>
                      {meeting.transcript
                        ? "✓ Transcript available"
                        : "No transcript"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;