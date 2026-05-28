import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "https://anivault-67h4.onrender.com";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Registration failed");
      }
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          AniAtlas
        </div>
        <h2>Create account</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="auth-field">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="pick a username" required autoFocus />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" required />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account" : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
