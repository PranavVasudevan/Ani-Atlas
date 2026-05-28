import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authHeader, isLoggedIn } from "../services/auth";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";

const API_BASE = process.env.REACT_APP_API_URL || "https://anivault-67h4.onrender.com";

const STATUS_LABELS = {
  all: "All",
  planned: "Planned",
  watching: "Watching",
  completed: "Completed",
  dropped: "Dropped",
};

const STATUS_COLORS = {
  planned: "#1e90ff",
  watching: "#32cd32",
  completed: "#ffd700",
  dropped: "#ff4500",
};

export default function Watchlist() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/watchlist`, {
        headers: { "Content-Type": "application/json", ...authHeader() },
        credentials: "omit",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    setLoading(false);
  }

  async function removeEntry(animeId) {
    await fetch(`${API_BASE}/watchlist/${animeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
      credentials: "omit",
    });
    setEntries(prev => prev.filter(e => e.anime_id !== animeId));
  }

  const filtered = entries
    .filter(e => filter === "all" || e.status === filter)
    .filter(e => !search.trim() || e.anime_title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="watchlist-page">
      <Navbar />

      <div className="page-top-bar">
        <h1 className="section-title">Watchlist <span>({entries.length})</span></h1>
        <div className="filter-bar">
          <input
            placeholder="Search watchlist…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 180 }}
          />
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <button
              key={val}
              className={`filter-chip${filter === val ? " active" : ""}`}
              onClick={() => setFilter(val)}
            >
              {label}
              {val !== "all" && (
                <span style={{ marginLeft: 5, opacity: 0.5, fontSize: "0.75em" }}>
                  ({entries.filter(e => e.status === val).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="content" style={{ marginTop: 20 }}>
          <div className="anime-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="end">
          {entries.length === 0 ? "No anime in your watchlist yet." : "No matches in this category."}
        </p>
      ) : (
        <div className="content" style={{ marginTop: 20 }}>
          <div className="anime-grid">
            {filtered.map(w => (
              <div key={w.anime_id} className="card-shell anime-card-wrapper">
                <Link to={`/anime/${w.anime_id}`} className="anime-card">
                  <div className="anime-image-wrapper">
                    <img src={w.anime_image} alt={w.anime_title} />
                  </div>
                  <div className="anime-info">
                    <h3>{w.anime_title}</h3>
                    <span className="badge" style={{ color: `${STATUS_COLORS[w.status]} !important`, borderColor: `${STATUS_COLORS[w.status]}44` }}>
                      {w.status}
                    </span>
                  </div>
                </Link>
                <button
                  className="card-remove-btn"
                  onClick={() => removeEntry(w.anime_id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
