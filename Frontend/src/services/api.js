const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://anivault-67h4.onrender.com";

export async function fetchAnime({ search = "", mood = "", page = 1 }) {
  const url = `${API_BASE}?search=${encodeURIComponent(search)}&mood=${encodeURIComponent(mood)}&page=${page}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load anime");
  }

  return await res.json();
}
