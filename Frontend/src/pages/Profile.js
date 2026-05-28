import { useEffect, useState } from "react";
import { authHeader } from "../services/auth";
import { isLoggedIn } from "../services/auth";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://anivault-67h4.onrender.com";


export default function Profile() {
  const [journals, setJournals] = useState([]);

  useEffect(() => {
  if (!isLoggedIn()) return;

  fetch(`${API_BASE}/journal`, {
  headers: {
    "Content-Type": "application/json",
    ...authHeader()
  },
  credentials: "omit"
})
  .then(r => r.json())
  .then(setJournals);

}, []);

  return (
    <div className="profile-glass">
      <h1>Your Journal</h1>

      {journals.length === 0 && (
        <p className="end">No journal entries yet</p>
      )}

      {journals.map(j => (
        <div key={j.id} className="journal-entry">
          <p>{j.content}</p>
          {j.rating && <span className="badge">Rating: {j.rating}/10</span>}
        </div>
      ))}
    </div>
  );
}
