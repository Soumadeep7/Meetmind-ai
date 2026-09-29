import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import API_URL from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Go to dashboard after login
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
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
            Turn every meeting into
            <span> meaningful action.</span>
          </h1>

          <p>
            Let AI summarize your meetings, extract action items,
            and keep your team organized.
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
              🧠
            </div>

            <h2>Welcome back</h2>

            <p>
              Sign in to continue to MeetMind AI
            </p>
          </div>

          <form onSubmit={handleSubmit}>

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

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <div className="login-footer">
            <span>Don't have an account?</span>

            <Link to="/register">
              Create account
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;