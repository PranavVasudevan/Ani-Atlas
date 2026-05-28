import { useEffect, useState } from "react";

export default function Home() {
  const [anime, setAnime] = useState([]);
  const [search, setSearch] = useState("");
  const [mood, setMood] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchAnime = async (reset = false) => {
    setLoading(true);

    const url = `http://localhost:8000/anime?search=${search}&mood=${mood}&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();

    setAnime(prev => reset ? data : [...prev, ...data]);
    setLoading(false);
  };

  // initial load + filter change
  useEffect(() => {
    setPage(1);
    fetchAnime(true);
  }, [search, mood]);

  // infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        if (!loading) {
          setPage(prev => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]);

  useEffect(() => {
    if (page > 1) fetchAnime();
  }, [page]);

  return (
    <div style={{ padding: "20px", background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <h1 style={{ fontSize: "2.5rem" }}>AnimeVerse</h1>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          placeholder="Search anime..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px", width: "250px" }}
        />

        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          style={{ padding: "10px" }}
        >
          <option value="">All moods</option>
          <option value="happy">Happy</option>
          <option value="dark">Dark</option>
          <option value="hype">Hype</option>
        </select>
      </div>

      {/* ANIME GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "20px",
        }}
      >
        {anime.map(a => (
          <div
            key={a.id}
            style={{
              background: "#1e293b",
              borderRadius: "10px",
              padding: "10px",
            }}
          >
            <img
              src={a.image}
              alt={a.title}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <h3 style={{ fontSize: "1rem", margin: "10px 0" }}>{a.title}</h3>
            <p>⭐ {a.rating}</p>
            <p>{a.genre}</p>
            <p style={{ opacity: 0.7 }}>Mood: {a.mood}</p>
          </div>
        ))}
      </div>

      {loading && <p style={{ textAlign: "center", margin: "20px" }}>Loading more anime…</p>}
    </div>
  );
}
