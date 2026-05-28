import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../services/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const links = [
    { label: "Home", path: "/" },
    { label: "Favourites", path: "/favorites" },
    { label: "Watchlist", path: "/watchlist" },
    { label: "Tier List", path: "/tierlist" },
  ];

  return (
    <nav className="navbar">
      <button className="navbar-brand" onClick={() => navigate("/")} style={{ background: "none", border: "none", boxShadow: "none", padding: 0, cursor: "pointer", transform: "none" }}>
        <span className="brand-dot" />
        <span className="brand">AniAtlas</span>
      </button>

      <div className="navbar-links">
        {links.map((l) => (
          <button
            key={l.path}
            className={`nav-btn${location.pathname === l.path ? " active" : ""}`}
            onClick={() => navigate(l.path)}
          >
            {l.label}
          </button>
        ))}
        <span className="nav-divider" />
        <button className="nav-btn logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
