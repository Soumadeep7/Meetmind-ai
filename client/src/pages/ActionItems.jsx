import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function ActionItems() {
  const navigate = useNavigate();

  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchActionItems = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/action-items/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch action items"
        );
      }

      setActionItems(data.actionItems || []);
    } catch (error) {
      console.error("Action items error:", error);
      setActionItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionItems();
  }, []);

  // Update task status
  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:5000/api/action-items/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update task");
        return;
      }

      setActionItems((items) =>
        items.map((item) =>
          item._id === id
            ? {
              ...item,
              status,
            }
            : item
        )
      );
    } catch (error) {
      console.error("Update status error:", error);
      alert("Unable to update task");
    }
  };

  // Delete task
  const deleteItem = async (id) => {
    const confirmed = window.confirm(
      "Delete this action item?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:5000/api/action-items/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete task");
        return;
      }

      setActionItems((items) =>
        items.filter((item) => item._id !== id)
      );
    } catch (error) {
      console.error("Delete item error:", error);
      alert("Unable to delete task");
    }
  };

  // Format normal date
  const formatDate = (date) => {
    if (!date) return "No deadline";

    const [year, month, day] = date
      .split("T")[0]
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getDeadlineInfo = (dueDate, status) => {
    // Completed tasks
    if (status === "completed") {
      return {
        label: "Completed",
        className: "deadline-completed",
      };
    }

    // No deadline
    if (!dueDate) {
      return {
        label: "No deadline",
        className: "deadline-none",
      };
    }

    // Convert database date to local date
    const [year, month, day] = dueDate
      .split("T")[0]
      .split("-")
      .map(Number);

    const due = new Date(year, month - 1, day);

    // Today's date
    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Difference in days
    const difference = Math.round(
      (due - todayOnly) / (1000 * 60 * 60 * 24)
    );

    // Overdue
    if (difference < 0) {
      const daysOverdue = Math.abs(difference);

      return {
        label:
          daysOverdue === 1
            ? "Overdue by 1 day"
            : `Overdue by ${daysOverdue} days`,
        className: "deadline-overdue",
      };
    }

    // Due today
    if (difference === 0) {
      return {
        label: "Due today",
        className: "deadline-today",
      };
    }

    // Due tomorrow
    if (difference === 1) {
      return {
        label: "Due tomorrow",
        className: "deadline-tomorrow",
      };
    }

    // Upcoming
    return {
      label: `Due in ${difference} days`,
      className: "deadline-upcoming",
    };
  };

  // Feature 4.3: Due-Date Intelligence
  const getDueDateInfo = (dueDate, status) => {
    // No deadline
    if (!dueDate) {
      return {
        label: "No deadline",
        className: "no-deadline",
      };
    }

    const today = new Date();
    const due = new Date(dueDate);

    // Remove time from both dates
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const difference = Math.ceil(
      (due.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    // Completed task
    if (status === "completed") {
      return {
        label: `Due ${formatDate(dueDate)}`,
        className: "completed-date",
      };
    }

    // Overdue
    if (difference < 0) {
      const daysOverdue = Math.abs(difference);

      return {
        label: `Overdue by ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"
          }`,
        className: "overdue",
      };
    }

    // Due today
    if (difference === 0) {
      return {
        label: "Due today",
        className: "due-today",
      };
    }

    // Due within 3 days
    if (difference <= 3) {
      return {
        label: `Due in ${difference} ${difference === 1 ? "day" : "days"
          }`,
        className: "due-soon",
      };
    }

    // Upcoming
    return {
      label: `Due ${formatDate(dueDate)}`,
      className: "upcoming",
    };
  };

  const pendingCount = actionItems.filter(
    (item) => item.status === "pending"
  ).length;

  const inProgressCount = actionItems.filter(
    (item) => item.status === "in-progress"
  ).length;

  const completedCount = actionItems.filter(
    (item) => item.status === "completed"
  ).length;

  // Filter action items
  const filteredItems = actionItems.filter((item) => {
    if (activeFilter === "all") {
      return true;
    }

    return item.status === activeFilter;
  });

  return (
    <div className="ai-page">

      {/* Sidebar */}
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

          <button className="ai-nav-item active">
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

      {/* Main */}
      <main className="ai-main">

        {/* Header */}
        <div className="ai-header">

          <div>
            <div className="ai-eyebrow">
              MEETMIND AI
            </div>

            <h1>My Action Items</h1>

            <p>
              Tasks assigned to you from your meetings.
            </p>
          </div>

          <div className="ai-total">
            <strong>{actionItems.length}</strong>

            <span>
              {actionItems.length === 1
                ? "task"
                : "tasks"}
            </span>
          </div>

        </div>

        {/* Statistics */}
        <div className="ai-stats">

          <div className="ai-stat-card">
            <div className="ai-stat-icon pending-icon">
              ⏳
            </div>

            <div>
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>
          </div>

          <div className="ai-stat-card">
            <div className="ai-stat-icon progress-icon">
              🔄
            </div>

            <div>
              <span>In Progress</span>
              <strong>{inProgressCount}</strong>
            </div>
          </div>

          <div className="ai-stat-card">
            <div className="ai-stat-icon completed-icon">
              ✓
            </div>

            <div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className="ai-filter-bar">

          <button
            className={
              activeFilter === "all"
                ? "ai-filter active"
                : "ai-filter"
            }
            onClick={() => setActiveFilter("all")}
          >
            All
            <span>{actionItems.length}</span>
          </button>

          <button
            className={
              activeFilter === "pending"
                ? "ai-filter active"
                : "ai-filter"
            }
            onClick={() => setActiveFilter("pending")}
          >
            Pending
            <span>{pendingCount}</span>
          </button>

          <button
            className={
              activeFilter === "in-progress"
                ? "ai-filter active"
                : "ai-filter"
            }
            onClick={() =>
              setActiveFilter("in-progress")
            }
          >
            In Progress
            <span>{inProgressCount}</span>
          </button>

          <button
            className={
              activeFilter === "completed"
                ? "ai-filter active"
                : "ai-filter"
            }
            onClick={() =>
              setActiveFilter("completed")
            }
          >
            Completed
            <span>{completedCount}</span>
          </button>

        </div>

        {/* Section */}
        <div className="ai-section-header">

          <div>
            <h2>Your Tasks</h2>

            <p>
              Action items assigned to your account.
            </p>
          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="ai-empty">

            <div className="ai-loading">
              ⏳
            </div>

            <h3>
              Loading your action items...
            </h3>

            <p>
              Fetching your assigned tasks.
            </p>

          </div>
        )}

        {/* Empty */}
        {!loading && actionItems.length === 0 && (
          <div className="ai-empty">

            <div className="ai-empty-icon">
              ✓
            </div>

            <h3>
              No action items yet
            </h3>

            <p>
              Analyze a meeting to automatically
              generate tasks assigned to you.
            </p>

            <button
              className="ai-empty-button"
              onClick={() => navigate("/meetings")}
            >
              View Meetings
            </button>

          </div>
        )}

        {/* No filtered results */}
        {!loading &&
          actionItems.length > 0 &&
          filteredItems.length === 0 && (
            <div className="ai-empty">

              <div className="ai-empty-icon">
                ✓
              </div>

              <h3>
                No{" "}
                {activeFilter === "in-progress"
                  ? "in-progress"
                  : activeFilter}{" "}
                tasks
              </h3>

              <p>
                There are no action items in this
                category.
              </p>

            </div>
          )}

        {/* Task list */}
        {!loading &&
          filteredItems.length > 0 && (
            <div className="ai-task-list">

              {filteredItems.map((item) => {

                const dueInfo = getDueDateInfo(
                  item.dueDate,
                  item.status
                );

                return (
                  <div
                    className="ai-task-card"
                    key={item._id}
                  >

                    {/* Task */}
                    <div className="ai-task-main">

                      <div
                        className={`ai-check ${item.status === "completed"
                          ? "completed"
                          : ""
                          }`}
                      >
                        {item.status === "completed"
                          ? "✓"
                          : "○"}
                      </div>

                      <div className="ai-task-content">

                        <h3>{item.task}</h3>

                        <p className="ai-task-meeting">
                          📄{" "}
                          {item.meeting?.title ||
                            "Unknown meeting"}
                        </p>

                      </div>

                    </div>

                    {/* Details */}
                    <div className="ai-task-details">

                      <div className="ai-detail">

                        <span>ASSIGNED TO</span>

                        <strong>
                          {item.assigneeUser?.name ||
                            item.assignee ||
                            "Unassigned"}
                        </strong>

                      </div>

                      <div className="ai-detail">

                        <span>DUE DATE</span>

                        <strong>
                          {formatDate(item.dueDate)}
                        </strong>

                        <small
                          className={`ai-deadline-badge ${getDeadlineInfo(
                            item.dueDate,
                            item.status
                          ).className
                            }`}
                        >
                          {getDeadlineInfo(
                            item.dueDate,
                            item.status
                          ).label}
                        </small>

                      </div>

                      <select
                        value={
                          item.status || "pending"
                        }
                        onChange={(e) =>
                          updateStatus(
                            item._id,
                            e.target.value
                          )
                        }
                        className={`ai-status ${item.status
                          }`}
                      >
                        <option value="pending">
                          Pending
                        </option>

                        <option value="in-progress">
                          In Progress
                        </option>

                        <option value="completed">
                          Completed
                        </option>
                      </select>

                      <button
                        className="ai-delete"
                        onClick={() =>
                          deleteItem(item._id)
                        }
                        title="Delete task"
                      >
                        🗑
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

      </main>

    </div>
  );
}

export default ActionItems;