import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authHeader, isLoggedIn } from "../services/auth";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";

const API_BASE = process.env.REACT_APP_API_URL || "https://anivault-67h4.onrender.com";

const TIERS = [
  { key: "peak",  label: "PEAK",  color: "#ff4500", desc: "Absolute masterpiece" },
  { key: "great", label: "GREAT", color: "#ff8c00", desc: "Excellent, highly recommend" },
  { key: "good",  label: "GOOD",  color: "#32cd32", desc: "Solid, worth watching" },
  { key: "mid",   label: "MID",   color: "#1e90ff", desc: "Average, nothing special" },
  { key: "bad",   label: "BAD",   color: "#9370db", desc: "Disappointing" },
];

export default function Tierlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [editEntry, setEditEntry] = useState(null);
  const [editTier, setEditTier] = useState("");
  const [editRating, setEditRating] = useState("");
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/tierlist`, {
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
    await fetch(`${API_BASE}/tierlist/${animeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
      credentials: "omit",
    });
    setEntries(prev => prev.filter(e => e.anime_id !== animeId));
  }

  function openEdit(entry) {
    setEditEntry(entry);
    setEditTier(entry.tier);
    setEditRating(entry.personal_rating ?? "");
    setEditComment(entry.comment ?? "");
  }

  async function saveEdit() {
    if (!editTier) return;
    setSaving(true);
    await fetch(`${API_BASE}/tierlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        anime_id: editEntry.anime_id,
        anime_title: editEntry.anime_title,
        anime_image: editEntry.anime_image,
        tier: editTier,
        personal_rating: editRating ? Number(editRating) : null,
        comment: editComment || null,
      }),
    });
    setEntries(prev => prev.map(e =>
      e.anime_id === editEntry.anime_id
        ? { ...e, tier: editTier, personal_rating: editRating ? Number(editRating) : null, comment: editComment || null }
        : e
    ));
    setSaving(false);
    setEditEntry(null);
  }

  const displayed = entries.filter(e => {
    const matchesTier = filterTier === "all" || e.tier === filterTier;
    const matchesSearch = !search.trim() || e.anime_title?.toLowerCase().includes(search.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <div className="tierlist-page">
      <Navbar />

      <div className="page-top-bar">
        <h1 className="section-title">Tier List <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "1rem" }}>({entries.length})</span></h1>
        <div className="filter-bar">
          <input
            placeholder="Search tier list"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <button className={`filter-chip${filterTier === "all" ? " active" : ""}`} onClick={() => setFilterTier("all")}>
            All
          </button>
          {TIERS.map(t => (
            <button
              key={t.key}
              className={`filter-chip${filterTier === t.key ? " active" : ""}`}
              onClick={() => setFilterTier(t.key)}
              style={filterTier === t.key ? { borderColor: `${t.color}66`, color: t.color, background: `${t.color}18` } : {}}
            >
              {t.label}
              <span style={{ marginLeft: 5, opacity: 0.5, fontSize: "0.75em" }}>
                ({entries.filter(e => e.tier === t.key).length})
              </span>
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
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 80, color: "var(--text-muted)" }}>
          <p style={{ fontSize: "1rem", marginBottom: 8 }}>Your tier list is empty.</p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-dim)" }}>Open any anime and click <strong>Add to Tier List</strong> to rank it.</p>
        </div>
      ) : (
        <div className="content" style={{ marginTop: 16 }}>
          {(filterTier === "all" ? TIERS : TIERS.filter(t => t.key === filterTier)).map(tier => {
            const tierEntries = displayed.filter(e => e.tier === tier.key);
            if (filterTier === "all" && tierEntries.length === 0) return null;
            return (
              <div key={tier.key} className="tier-section">
                <div className={`tier-label ${tier.key}`}>
                  {tier.label}
                  <span className="tier-label-desc">{tier.desc}</span>
                  <span className="tier-count">{tierEntries.length} anime</span>
                </div>
                <div className="tier-body">
                  {tierEntries.length === 0 ? (
                    <div className="tier-empty">Nothing here yet</div>
                  ) : (
                    <div className="tier-grid">
                      {tierEntries.map(e => (
                        <div key={e.anime_id} className="tier-card" onClick={() => openEdit(e)}>
                          <Link to={`/anime/${e.anime_id}`} onClick={ev => ev.stopPropagation()} style={{ display: "block" }}>
                            <img src={e.anime_image} alt={e.anime_title} />
                          </Link>
                          <div className="tier-card-info">
                            <h4>{e.anime_title}</h4>
                            {e.personal_rating && (
                              <span className="tier-card-rating">{e.personal_rating}/10</span>
                            )}
                          </div>
                          <button
                            className="tier-card-remove"
                            onClick={ev => { ev.stopPropagation(); removeEntry(e.anime_id); }}
                            title="Remove"
                          >x</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editEntry && (
        <div className="tier-modal-overlay" onClick={e => e.target === e.currentTarget && setEditEntry(null)}>
          <div className="tier-modal">
            <button className="tier-modal-close" onClick={() => setEditEntry(null)}>x</button>
            <h3>Edit — {editEntry.anime_title}</h3>

            <label>Tier</label>
            <div className="tier-select-row">
              {TIERS.map(t => (
                <button
                  key={t.key}
                  className={`tier-select-btn ${t.key}-btn${editTier === t.key ? " selected" : ""}`}
                  onClick={() => setEditTier(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label>Personal Rating (1-10)</label>
            <input type="number" min="1" max="10" value={editRating} onChange={e => setEditRating(e.target.value)} placeholder="e.g. 9" />

            <label>Comment</label>
            <textarea value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="Your thoughts" style={{ minHeight: 80 }} />

            <button className="tier-modal-save" onClick={saveEdit} disabled={!editTier || saving}>
              {saving ? "Saving" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
