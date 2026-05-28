# AniAtlas

AniAtlas is a full-stack anime discovery, tracking, and recommendation platform that helps users explore anime, manage watchlists, maintain personal journals, and receive personalized recommendations based on their viewing preferences.

The application is built using a FastAPI backend, a React frontend, and real-time anime data from the Jikan (MyAnimeList) API.

---

## Features

### Anime Discovery
- Browse top-rated anime with infinite scrolling
- Filter anime by genre
- Search anime by title

### Favorites System
- Add anime to favorites
- Remove favorites at any time
- Favorites directly influence recommendation logic

### Watchlist
- Track anime under:
  - Planned  
  - Watching  
  - Completed  
  - Dropped  
- Filter watchlist entries by status

### AI-Based Recommendations
- Personalized anime suggestions based on favorited anime
- Cached recommendation logic for faster repeated access
- Default recommendations for new users

### Personal Journal
- Write personal notes for each anime
- Add personal ratings
- All journal entries are stored per user

### Authentication
- JWT-based authentication
- Secure password hashing using bcrypt
- Protected API endpoints

---

## Technology Stack

| Layer | Technology |
|------|-----------|
| Frontend | React |
| Backend | FastAPI |
| Database | SQLite / PostgreSQL |
| Authentication | JWT + bcrypt |
| Anime Data | Jikan API (MyAnimeList) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## Live Deployment

Frontend  
https://ani-atlas.vercel.app

Backend  
https://anivault-67h4.onrender.com

---

## Roadmap

- Recommendation confidence scoring
- User profile pages
- Public watchlists
- Seasonal anime alerts
- Collaborative watchlists

---

## License

MIT
