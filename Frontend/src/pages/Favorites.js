import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authHeader, isLoggedIn } from "../services/auth";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";

const API_BASE = process.env.REACT_APP_API_URL || "https://anivault-67h4.onrender.com";

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/favorites`, {
        headers: { "Content-Type": "application/json", ...authHeader() },
        credentials: "omit",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    setLoading(false);
  }

  async function removeFavorite(animeId) {
    await fetch(`${API_BASE}/favorites/${animeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
      credentials: "omit",
    });
    setItems(prev => prev.filter(x => x.anime_id !== animeId));
  }

  const filtered = search.trim()
    ? items.filter(f => f.anime_title?.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="favorites-page">
      <Navbar />

      <div className="page-top-bar">
        <h1 className="section-title">Favourites <span>({items.length})</span></h1>
        <div className="filter-bar">
          <input
            placeholder="Search favourites…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 200 }}
          />
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
          {items.length === 0
            ? "No favourites yet — like some anime to see them here."
            : "No matches found."}
        </p>
      ) : (
        <div className="content" style={{ marginTop: 20 }}>
          <div className="anime-grid">
            {filtered.map(f => (
              <div key={f.anime_id} className="card-shell anime-card-wrapper">
                <Link to={`/anime/${f.anime_id}`} className="anime-card">
                  <div className="anime-image-wrapper">
                    <img src={f.anime_image} alt={f.anime_title} />
                  </div>
                  <div className="anime-info">
                    <h3>{f.anime_title}</h3>
                  </div>
                </Link>
                <button
                  className="card-remove-btn"
                  onClick={() => removeFavorite(f.anime_id)}
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
