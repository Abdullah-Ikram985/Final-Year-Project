import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, getErrorMessage } from "../api/client";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    try {
      setLoading(true);
      await loginAdmin(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err.message?.includes("admin required") || err.message?.includes("No token")
        ? err.message
        : getErrorMessage(err, "Login failed. Check credentials.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">A</div>
        <h1>Welcome Back</h1>
        <p className="login-subtitle">Login to your admin account</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" /> Remember me
            </label>
            <button type="button" className="forgot-btn">
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7, textAlign: "center" }}>
            Backend: POST /api/v1/users/login (role must be admin)
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
