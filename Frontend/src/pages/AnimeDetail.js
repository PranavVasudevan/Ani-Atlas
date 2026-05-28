import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authHeader, isLoggedIn } from "../services/auth";
import Navbar from "../components/Navbar";

const API_BASE = process.env.REACT_APP_API_URL || "https://anivault-67h4.onrender.com";

const TIER_CONFIG = {
  peak:  { label: "⚡ Peak",  color: "#ff4500" },
  great: { label: "🔥 Great", color: "#ff8c00" },
  good:  { label: "✅ Good",  color: "#32cd32" },
  mid:   { label: "〰 Mid",   color: "#1e90ff" },
  bad:   { label: "💀 Bad",   color: "#9370db" },
};

export default function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [anime, setAnime] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchStatus, setWatchStatus] = useState("");
  const [journal, setJournal] = useState("");
  const [rating, setRating] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);

  // Tierlist modal state
  const [showTierModal, setShowTierModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState("");
  const [tierRating, setTierRating] = useState("");
  const [tierComment, setTierComment] = useState("");
  const [tierSaved, setTierSaved] = useState(false);
  const [existingTier, setExistingTier] = useState(null);

  useEffect(() => {
    fetchAnime();
    if (isLoggedIn()) {
      checkFavorite();
      checkWatchlist();
      checkTierlist();
    }
  }, [id]);

  async function fetchAnime() {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    const json = await res.json();
    setAnime(json.data);
  }

  async function checkFavorite() {
    try {
      const res = await fetch(`${API_BASE}/favorites`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setIsFavorite(data.some(f => f.anime_id === Number(id)));
    } catch {}
  }

  async function toggleFavorite() {
    if (!anime) return;
    if (isFavorite) {
      await fetch(`${API_BASE}/favorites/${anime.mal_id}`, { method: "DELETE", headers: authHeader() });
      setIsFavorite(false);
    } else {
      await fetch(`${API_BASE}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ anime_id: anime.mal_id, anime_title: anime.title, anime_image: anime.images?.jpg?.image_url }),
      });
      setIsFavorite(true);
    }
  }

  async function checkWatchlist() {
    try {
      const res = await fetch(`${API_BASE}/watchlist`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const entry = data.find(w => w.anime_id === Number(id));
        if (entry) setWatchStatus(entry.status);
      }
    } catch {}
  }

  async function updateWatchlist(status) {
    if (!anime) return;
    setWatchStatus(status);
    await fetch(`${API_BASE}/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ anime_id: Number(id), status, anime_title: anime.title, anime_image: anime.images?.jpg?.image_url ?? "" }),
    });
  }

  async function checkTierlist() {
    try {
      const res = await fetch(`${API_BASE}/tierlist`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const entry = data.find(t => t.anime_id === Number(id));
        if (entry) {
          setExistingTier(entry);
          setSelectedTier(entry.tier);
          setTierRating(entry.personal_rating ?? "");
          setTierComment(entry.comment ?? "");
        }
      }
    } catch {}
  }

  async function saveTierlist() {
    if (!selectedTier || !anime) return;
    await fetch(`${API_BASE}/tierlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        anime_id: anime.mal_id,
        anime_title: anime.title,
        anime_image: anime.images?.jpg?.image_url,
        tier: selectedTier,
        personal_rating: tierRating ? Number(tierRating) : null,
        comment: tierComment || null,
      }),
    });
    setExistingTier({ tier: selectedTier, personal_rating: tierRating, comment: tierComment });
    setTierSaved(true);
    setTimeout(() => { setTierSaved(false); setShowTierModal(false); }, 1200);
  }

  async function saveJournal() {
    if (!journal.trim()) return;
    await fetch(`${API_BASE}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ anime_id: Number(id), content: journal, rating: rating ? Number(rating) : null }),
    });
    setJournalSaved(true);
    setTimeout(() => setJournalSaved(false), 2000);
  }

  if (!anime) return (
    <div>
      <Navbar />
      <p className="loading" style={{ marginTop: 80 }}>Loading anime…</p>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-layout">
          <div className="detail-poster">
            <img src={anime.images?.jpg?.large_image_url} alt={anime.title} />
          </div>

          <div className="detail-main">
            <h1>{anime.title}</h1>
            <p className="rating">★ {anime.score ?? "N/A"}</p>

            <div className="action-bar">
              <button
                style={isFavorite ? { background: "transparent", border: "1px solid rgba(224,0,26,0.5)", color: "#ff6666", boxShadow: "none" } : {}}
                onClick={toggleFavorite}
              >
                {isFavorite ? "♥ Unfavourite" : "♡ Favourite"}
              </button>

              <select value={watchStatus} onChange={e => updateWatchlist(e.target.value)}>
                <option value="">+ Watchlist</option>
                <option value="planned">Planned</option>
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>

              <button
                onClick={() => setShowTierModal(true)}
                style={existingTier ? {
                  background: "transparent",
                  border: `1px solid ${TIER_CONFIG[existingTier.tier]?.color}66`,
                  color: TIER_CONFIG[existingTier.tier]?.color,
                  boxShadow: "none"
                } : {}}
              >
                {existingTier ? `${TIER_CONFIG[existingTier.tier]?.label} Tier` : "☰ Add to Tier List"}
              </button>
            </div>

            <p className="synopsis">{anime.synopsis}</p>

            <div className="meta">
              <span>{anime.episodes ?? "?"} episodes</span>
              <span>{anime.aired?.from?.slice(0, 4)}</span>
              {anime.rating && <span>{anime.rating}</span>}
              {anime.genres?.slice(0, 3).map(g => <span key={g.mal_id}>{g.name}</span>)}
              {anime.studios?.[0] && <span>{anime.studios[0].name}</span>}
            </div>
          </div>
        </div>

        <div className="journal-glass">
          <h3>Your Journal</h3>
          <textarea
            placeholder="Write your thoughts about this anime…"
            value={journal}
            onChange={e => setJournal(e.target.value)}
          />
          <div className="journal-row">
            <input
              type="number"
              min="1"
              max="10"
              placeholder="Rating /10"
              value={rating}
              onChange={e => setRating(e.target.value)}
            />
            <button onClick={saveJournal} disabled={!journal.trim()}>
              {journalSaved ? "✓ Saved!" : "Save Journal"}
            </button>
          </div>
        </div>
      </div>

      {/* Tierlist Modal */}
      {showTierModal && (
        <div className="tier-modal-overlay" onClick={e => e.target === e.currentTarget && setShowTierModal(false)}>
          <div className="tier-modal">
            <button className="tier-modal-close" onClick={() => setShowTierModal(false)}>✕</button>
            <h3>Add to Tier List — {anime.title}</h3>

            <label>Select Tier</label>
            <div className="tier-select-row">
              {Object.entries(TIER_CONFIG).map(([val, cfg]) => (
                <button
                  key={val}
                  className={`tier-select-btn ${val}-btn${selectedTier === val ? " selected" : ""}`}
                  onClick={() => setSelectedTier(val)}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            <label>Personal Rating (1–10)</label>
            <input
              type="number"
              min="1"
              max="10"
              placeholder="e.g. 9"
              value={tierRating}
              onChange={e => setTierRating(e.target.value)}
            />

            <label>Comment</label>
            <textarea
              placeholder="What did you think of it?"
              value={tierComment}
              onChange={e => setTierComment(e.target.value)}
              style={{ minHeight: 70 }}
            />

            <button
              className="tier-modal-save"
              onClick={saveTierlist}
              disabled={!selectedTier}
            >
              {tierSaved ? "✓ Saved!" : "Save to Tier List"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
