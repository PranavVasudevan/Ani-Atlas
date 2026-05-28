import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { authHeader, isLoggedIn } from "../services/auth";
import SkeletonCard from "../components/SkeletonCard";
import Navbar from "../components/Navbar";

const API_BASE = process.env.REACT_APP_API_URL || "https://anivault-67h4.onrender.com";

function dedupe(list) {
  const map = new Map();
  list.forEach(a => a?.mal_id && map.set(a.mal_id, a));
  return Array.from(map.values());
}

export default function AnimeHome() {
  const observer = useRef(null);

  const [anime, setAnime] = useState([]);
  const [aiAnime, setAiAnime] = useState([]);
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("home");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [mediaType, setMediaType] = useState("tv");

  useEffect(() => {
    if (mode !== "home") return;
    fetchHome();
  }, [page, genre, mode]);

  async function fetchHome() {
    if (loading || !hasMore) return;
    setLoading(true);
    const params = new URLSearchParams({ page, type: mediaType });
    if (genre) params.append("genre", genre);
    const endpoint = mediaType === "movie" ? "anime/movies" : "anime";
    const res = await fetch(`${API_BASE}/${endpoint}?${params}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      setHasMore(false);
    } else {
      setAnime(prev => dedupe([...prev, ...data]));
    }
    setLoading(false);
  }

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!search.trim()) return;
    setMode("search");
    setAnime([]);
    setAiAnime([]);
    setHasMore(false);
    setLoading(true);
    const res = await fetch(`${API_BASE}/anime/search?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setAnime(Array.isArray(data) ? dedupe(data) : []);
    setLoading(false);
  }

  async function loadAIRecommendations(type = "tv", genreId = null) {
    if (!isLoggedIn()) return;
    setMode(type === "movie" ? "ai-movie" : "ai");
    setAnime([]);
    setAiAnime([]);
    setAiLoading(true);
    const qs = new URLSearchParams();
    qs.append("type", type);
    if (genreId) qs.append("genre", genreId);
    const res = await fetch(`${API_BASE}/ai/recommend?${qs.toString()}`, {
      headers: { "Content-Type": "application/json", ...authHeader() }
    });
    if (!res.ok) { setAiLoading(false); return; }
    const data = await res.json();
    setAiAnime(Array.isArray(data) ? data : []);
    setAiLoading(false);
  }

  function goHome() {
    setMode("home");
    setSearch("");
    setAnime([]);
    setHasMore(true);
    setAiAnime([]);
    setPage(1);
  }

  const lastAnimeRef = node => {
    if (loading || mode !== "home") return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(e => {
      if (e[0].isIntersecting && hasMore) setPage(p => p + 1);
    });
    node && observer.current.observe(node);
  };

  const list = mode.startsWith("ai") ? aiAnime : anime;

  return (
    <div className="home">
      <Navbar />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px" }}>
        <div className="hero">
          <h1>Discover your next <span>anime</span></h1>
          <p>AI-powered recommendations based on what you watch.</p>
        </div>
      </div>

      <div className="controls" style={{ margin: "20px auto", maxWidth: 1400 }}>
        <div className="controls-left">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
            <input
              placeholder="Search anime…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 180 }}
            />
            <button type="submit">Search</button>
          </form>

          <select value={mediaType} onChange={e => {
            setMediaType(e.target.value);
            setAnime([]);
            setPage(1);
            setHasMore(true);
            setMode("home");
          }}>
            <option value="tv">Series</option>
            <option value="movie">Movies</option>
          </select>

          <select value={genre} onChange={e => {
            setGenre(e.target.value);
            setAnime([]);
            setPage(1);
            setHasMore(true);
            setMode("home");
          }}>
            <option value="">All genres</option>
            <option value="1">Action</option>
            <option value="4">Comedy</option>
            <option value="8">Drama</option>
            <option value="14">Horror</option>
            <option value="22">Romance</option>
            <option value="36">Slice of Life</option>
            <option value="41">Thriller</option>
          </select>
        </div>

        <div className="controls-center">
          <button className="ai-button secondary" onClick={goHome}>Home</button>
        </div>

        <div className="controls-right">
          <button className="ai-button" onClick={() => loadAIRecommendations("tv")} disabled={aiLoading}>
            {aiLoading ? "Loading…" : "✦ Recommend Anime"}
          </button>
          <button className="ai-button secondary" onClick={() => loadAIRecommendations("movie")} disabled={aiLoading}>
            ✦ Recommend Movies
          </button>
        </div>
      </div>

      {mode.startsWith("ai") && aiAnime.length > 0 && (
        <div className="spotlight" style={{ maxWidth: 1400 }}>
          <div className="spotlight-header">
            <h2>Recommended For You</h2>
            <span className="spotlight-badge">AI Pick</span>
          </div>
          <div className="spotlight-row">
            {aiAnime.slice(0, 6).map(a => (
              <Link to={`/anime/${a.mal_id}`} key={a.mal_id} className="spotlight-card">
                <img src={a.images?.jpg?.image_url} alt={a.title} />
                <span>{a.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="content" style={{ maxWidth: 1440 }}>
        <div className="anime-grid">
          {list.map((a, i) => {
            const year = a.aired?.from ? new Date(a.aired.from).getFullYear() : "—";
            const episodes = a.episodes ?? "—";
            const card = (
              <Link to={`/anime/${a.mal_id}`} className="anime-card">
                <div className="anime-image-wrapper">
                  <img src={a.images?.jpg?.image_url} alt={a.title} />
                  <div className="anime-hover">
                    <span className="hover-pill">{episodes} eps</span>
                    <span className="hover-pill">{year}</span>
                  </div>
                </div>
                <div className="anime-info">
                  <h3>{a.title}</h3>
                  <span className="rating">★ {a.score ?? "N/A"}</span>
                </div>
              </Link>
            );
            return i === list.length - 1 && mode === "home" ? (
              <div ref={lastAnimeRef} key={a.mal_id} className="card-shell">{card}</div>
            ) : (
              <div key={a.mal_id} className="card-shell">{card}</div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="content">
          <div className="anime-grid">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {!loading && list.length === 0 && !aiLoading && <p className="end">No anime found</p>}
      {aiLoading && <p className="loading" style={{ paddingTop: 60 }}>Finding recommendations…</p>}
    </div>
  );
}
