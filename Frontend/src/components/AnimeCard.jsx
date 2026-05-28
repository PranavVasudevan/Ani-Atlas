export default function AnimeCard({ anime }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 10 }}>
      <h3>{anime.title}</h3>
      <p>
        {anime.genre} | {anime.year} | ⭐ {anime.rating} | {anime.mood}
      </p>
    </div>
  );
}
