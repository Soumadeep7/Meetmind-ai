import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateMeeting from "./pages/CreateMeeting";
import Meetings from "./pages/Meetings";
import ActionItems from "./pages/ActionItems";
import MeetingDetails from "./pages/MeetingDetails";

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Login Page */}
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/meetings/new" element={<CreateMeeting />} />

      <Route path="/meetings" element={<Meetings />} />

      <Route path="/action-items" element={<ActionItems />} />
      
      <Route path="/meetings/:id" element={<MeetingDetails />} />
    </Routes>
  );
}

/* ==============================
   Landing Page
============================== */

function LandingPage() {
  return (
    <div className="app">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          MeetMind<span>AI</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>

          <a href="/login" className="login-btn">
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">

          <div className="badge">
            ✨ AI-Powered Meeting Assistant
          </div>

          <h1>
            Turn meetings into
            <span> actionable tasks.</span>
          </h1>

          <p>
            Upload your meeting audio or transcript and let AI
            automatically generate summaries, decisions, and
            action items.
          </p>

          <div className="hero-buttons">
            <Link to="/meetings/new" className="primary-btn">
                Upload Meeting
            </Link>

            <button className="secondary-btn">
              See How It Works
            </button>
          </div>

          <div className="hero-info">
            <span>✓ AI-powered summaries</span>
            <span>✓ Automatic action items</span>
            <span>✓ Meeting history</span>
          </div>
        </div>

        {/* Meeting Preview */}
        <div className="meeting-preview">

          <div className="preview-header">
            <div>
              <h3>Sprint Planning Meeting</h3>
              <p>Today • 10:30 AM</p>
            </div>

            <span className="processed">
              AI Processed
            </span>
          </div>

          <div className="summary-box">
            <h4>🧠 Summary</h4>

            <p>
              The team discussed the upcoming sprint,
              login API, dashboard development, and
              deployment strategy.
            </p>
          </div>

          <div className="action-section">

            <div className="action-header">
              <h4>Action Items</h4>
              <span>3 tasks</span>
            </div>

            <div className="action-item">
              <div className="check">✓</div>

              <div className="task-info">
                <strong>Complete Login API</strong>
                <small>Development • Aug 17</small>
              </div>

              <span className="priority high">
                High
              </span>
            </div>

            <div className="action-item">
              <div className="check">✓</div>

              <div className="task-info">
                <strong>Design Dashboard</strong>
                <small>Design  • Aug 19</small>
              </div>

              <span className="priority medium">
                Medium
              </span>
            </div>

            <div className="action-item">
              <div className="check">✓</div>

              <div className="task-info">
                <strong>Prepare Deployment</strong>
                <small>Team • Aug 21</small>
              </div>

              <span className="priority low">
                Low
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">

        <div className="section-heading">

          <span className="section-label">
            POWERFUL FEATURES
          </span>

          <h2>
            Everything you need after
            <span> every meeting.</span>
          </h2>

          <p>
            MeetMind AI transforms unstructured conversations
            into organized and actionable information.
          </p>

        </div>

        <div className="feature-grid">

          <Feature
            icon="🎙️"
            title="Audio Transcription"
            description="Upload meeting recordings and convert speech into accurate text using Whisper."
          />

          <Feature
            icon="🧠"
            title="AI Summary"
            description="Automatically generate concise meeting summaries and important discussion points."
          />

          <Feature
            icon="✅"
            title="Action Items"
            description="Extract tasks, owners, deadlines, priorities, and completion status automatically."
          />

          <Feature
            icon="📌"
            title="Decision Tracking"
            description="Keep track of important decisions made during your meetings."
          />

          <Feature
            icon="🔍"
            title="Meeting Search"
            description="Search previous meetings and quickly find important information."
          />

          <Feature
            icon="📊"
            title="Meeting Analytics"
            description="Track meetings, completed tasks, pending tasks, and overdue action items."
          />

        </div>
      </section>

      {/* How it works */}
      <section
        className="how-it-works"
        id="how-it-works"
      >

        <div className="section-heading">

          <span className="section-label">
            HOW IT WORKS
          </span>

          <h2>
            From conversation to
            <span> action.</span>
          </h2>

        </div>

        <div className="steps">

          <Step
            number="01"
            title="Upload Meeting"
            description="Upload an audio recording or provide a meeting transcript."
          />

          <Step
            number="02"
            title="AI Processing"
            description="Whisper transcribes audio and AI analyzes the meeting content."
          />

          <Step
            number="03"
            title="Get Actionable Notes"
            description="Receive summaries, decisions, and structured action items."
          />

        </div>

      </section>

      {/* CTA */}
      <section className="cta">

        <h2>
          Never forget a meeting task again.
        </h2>

        <p>
          Let AI handle your meeting notes while you focus
          on the work that matters.
        </p>

        <Link to="/login" className="primary-btn">
          Get Started
        </Link>

      </section>

      {/* Footer */}
      <footer>

        <div className="logo">
          MeetMind<span>AI</span>
        </div>

        <p>
          AI-powered meeting intelligence.
        </p>

        <small>
          © 2026 MeetMind AI. All rights reserved.
        </small>

      </footer>

    </div>
  );
}

/* ==============================
   Feature Component
============================== */

function Feature({ icon, title, description }) {
  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

    </div>
  );
}

/* ==============================
   Step Component
============================== */

function Step({ number, title, description }) {
  return (
    <div className="step">

      <div className="step-number">
        {number}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

    </div>
  );
}

export default App;