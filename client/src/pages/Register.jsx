import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import API_URL from "../api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Account created successfully!");

      // Go to login page
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Left side */}
      <div className="auth-left">

        <div className="auth-brand">
          MeetMind<span>AI</span>
        </div>

        <div className="auth-left-content">

          <div className="auth-badge">
            ✨ AI-Powered Meeting Assistant
          </div>

          <h1>
            Make your meetings
            <span> more productive.</span>
          </h1>

          <p>
            Create your MeetMind AI account and let AI
            turn your meeting conversations into clear,
            actionable work.
          </p>

          <div className="auth-features">
            <div>✓ AI-powered meeting summaries</div>
            <div>✓ Automatic action item extraction</div>
            <div>✓ Organized meeting history</div>
          </div>

        </div>

      </div>

      {/* Right side */}
      <div className="auth-right">

        <div className="login-card">

          <div className="login-header">

            <div className="login-icon">
              🚀
            </div>

            <h2>Create account</h2>

            <p>
              Start using MeetMind AI today
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div className="form-group">

              <label>Full name</label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />

            </div>

            {/* Email */}
            <div className="form-group">

              <label>Email address</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

            </div>

            {/* Password */}
            <div className="form-group">

              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={6}
              />

            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          <div className="login-footer">

            <span>Already have an account?</span>

            <Link to="/login">
              Sign in
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;