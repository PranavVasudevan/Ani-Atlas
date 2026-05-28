from collections import Counter

import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Favorite
from auth.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])

JIKAN = "https://api.jikan.moe/v4/anime"


async def fetch_genres(anime_id: int, client: httpx.AsyncClient) -> list[int]:
    """Return MAL genre IDs for a given anime_id, empty list on failure."""
    try:
        res = await client.get(f"https://api.jikan.moe/v4/anime/{anime_id}", timeout=8)
        data = res.json().get("data", {})
        return [g["mal_id"] for g in data.get("genres", [])]
    except Exception:
        return []


@router.get("/recommend")
async def recommend(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
    type: str = Query("tv"),          # tv | movie
    genre: int | None = Query(None),  # Manual genre override from frontend
):
    favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()

    params: dict = {
        "order_by": "score",
        "sort": "desc",
        "limit": 25,
        "type": type,
        "sfw": "true",
    }

    async with httpx.AsyncClient(timeout=12) as client:

        # If user has favorites, derive their top genres automatically.
        # Use the top 3 favorites to keep Jikan calls minimal.
        if favorites and not genre:
            genre_counts: Counter = Counter()
            for fav in favorites[:3]:
                ids = await fetch_genres(fav.anime_id, client)
                genre_counts.update(ids)

            if genre_counts:
                # Pick the single most common genre for the query
                top_genre = genre_counts.most_common(1)[0][0]
                params["genres"] = top_genre

        elif genre:
            params["genres"] = genre

        res = await client.get(JIKAN, params=params)
        data = res.json().get("data", [])

    # Filter out anime the user already has in favorites
    fav_ids = {f.anime_id for f in favorites}
    filtered = [a for a in data if a.get("mal_id") not in fav_ids]

    return filtered[:24]
