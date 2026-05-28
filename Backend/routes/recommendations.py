"""
Personal recommendation engine.

Signal priority (highest to lowest):
  1. Tier list entries rated "peak" or "great"  — strongest taste signal
  2. Journal entries with rating >= 8           — explicit positive rating
  3. Favorites                                  — liked enough to save
  4. Watchlist "completed"                      — finished watching

From those signals we build:
  - A weighted genre profile
  - A weighted studio profile
  - A set of "seeds" to use Jikan's recommendations endpoint (per-anime recs)

Strategy:
  A) For each high-signal anime we fetch Jikan's /anime/{id}/recommendations
     These are crowd-sourced "if you liked X, watch Y" — much more personal
     than just querying top-scored anime in a genre.
  B) We also do 2-3 genre+studio targeted queries with randomised pages
     so results don't repeat every time.
  C) We deduplicate, filter out already-seen titles, score candidates by
     how many times they appeared across queries, then return the top 24.
"""

import asyncio
import random
from collections import Counter, defaultdict

import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Favorite, Journal, Tierlist, Watchlist
from auth.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])

JIKAN = "https://api.jikan.moe/v4"

TIER_WEIGHT = {"peak": 5, "great": 3, "good": 1, "mid": 0, "bad": -2}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _anime_detail(anime_id: int, client: httpx.AsyncClient) -> dict:
    try:
        r = await client.get(f"{JIKAN}/anime/{anime_id}", timeout=8)
        return r.json().get("data", {})
    except Exception:
        return {}


async def _jikan_recommendations(anime_id: int, client: httpx.AsyncClient) -> list[dict]:
    """Crowd-sourced 'if you liked X watch Y' from Jikan."""
    try:
        r = await client.get(f"{JIKAN}/anime/{anime_id}/recommendations", timeout=8)
        entries = r.json().get("data", [])
        # Each entry has .entry (the recommended anime) and .votes
        return [e["entry"] for e in entries if "entry" in e]
    except Exception:
        return []


async def _jikan_search(params: dict, client: httpx.AsyncClient) -> list[dict]:
    try:
        r = await client.get(f"{JIKAN}/anime", params=params, timeout=10)
        return r.json().get("data", [])
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.get("/recommend")
async def recommend(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
    type: str = Query("tv"),
):
    # ---- 1. Collect user signals ----------------------------------------
    favorites   = db.query(Favorite).filter(Favorite.user_id == user_id).all()
    watchlist   = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    journals    = db.query(Journal).filter(Journal.user_id == user_id).all()
    tierlist    = db.query(Tierlist).filter(Tierlist.user_id == user_id).all()

    # All anime the user has already interacted with — exclude from results
    seen_ids: set[int] = set()
    seen_ids.update(f.anime_id for f in favorites)
    seen_ids.update(w.anime_id for w in watchlist)
    seen_ids.update(j.anime_id for j in journals)
    seen_ids.update(t.anime_id for t in tierlist)

    # Weighted seed list: (anime_id, weight)
    seeds: dict[int, float] = defaultdict(float)

    for t in tierlist:
        w = TIER_WEIGHT.get(t.tier, 0)
        if w > 0:
            seeds[t.anime_id] += w

    for j in journals:
        if j.rating and j.rating >= 8:
            seeds[j.anime_id] += 2.5
        elif j.rating and j.rating >= 6:
            seeds[j.anime_id] += 1.0

    for f in favorites:
        seeds[f.anime_id] += 1.5

    for w in watchlist:
        if w.status == "completed":
            seeds[w.anime_id] += 1.0

    # ---- 2. If no signals at all, fall back to popular by type -----------
    if not seeds:
        async with httpx.AsyncClient() as client:
            results = await _jikan_search({
                "type": type,
                "order_by": "members",
                "sort": "desc",
                "limit": 24,
                "sfw": "true",
                "page": random.randint(1, 3),
            }, client)
        return results[:24]

    # ---- 3. Pick top seeds (by weight, max 5 to stay within rate limits) -
    top_seeds = sorted(seeds.items(), key=lambda x: x[1], reverse=True)[:5]
    top_seed_ids = [sid for sid, _ in top_seeds]

    # ---- 4. Fetch genres/studios from seeds + per-anime recommendations --
    genre_score: Counter = Counter()
    studio_score: Counter = Counter()
    candidate_scores: Counter = Counter()

    async with httpx.AsyncClient() as client:
        # Fetch details for seeds (to build genre/studio profile)
        detail_tasks = [_anime_detail(sid, client) for sid in top_seed_ids]
        rec_tasks    = [_jikan_recommendations(sid, client) for sid in top_seed_ids]

        details, rec_lists = await asyncio.gather(
            asyncio.gather(*detail_tasks),
            asyncio.gather(*rec_tasks),
        )

    # Build genre + studio profile
    for detail, (seed_id, weight) in zip(details, top_seeds):
        for g in detail.get("genres", []):
            genre_score[g["mal_id"]] += weight
        for g in detail.get("themes", []):
            genre_score[g["mal_id"]] += weight * 0.5
        for s in detail.get("studios", []):
            studio_score[s["mal_id"]] += weight

    # Score per-anime recommendations
    for rec_list, (seed_id, weight) in zip(rec_lists, top_seeds):
        for rec in rec_list:
            mid = rec.get("mal_id")
            if mid and mid not in seen_ids:
                candidate_scores[mid] += weight * 1.5  # rec bonus
                # store the minimal data we already have
                # (title + image) so we don't need another fetch
                if not hasattr(candidate_scores, "_meta"):
                    candidate_scores._meta = {}
                candidate_scores._meta = getattr(candidate_scores, "_meta", {})
                candidate_scores._meta[mid] = rec

    # ---- 5. Genre-targeted queries with random pages to vary results -----
    top_genres = [gid for gid, _ in genre_score.most_common(3)]
    top_studios = [sid for sid, _ in studio_score.most_common(2)]

    search_tasks = []
    async with httpx.AsyncClient() as client:
        queries = []

        # genre combos
        for gid in top_genres[:2]:
            queries.append({
                "genres": gid,
                "type": type,
                "order_by": "score",
                "sort": "desc",
                "min_score": 7,
                "limit": 20,
                "sfw": "true",
                "page": random.randint(1, 4),
            })

        # genre pair (more niche)
        if len(top_genres) >= 2:
            queries.append({
                "genres": f"{top_genres[0]},{top_genres[1]}",
                "type": type,
                "order_by": "members",
                "sort": "desc",
                "limit": 20,
                "sfw": "true",
                "page": random.randint(1, 3),
            })

        # studio query
        if top_studios:
            queries.append({
                "producers": top_studios[0],
                "type": type,
                "order_by": "score",
                "sort": "desc",
                "limit": 15,
                "sfw": "true",
            })

        results_list = await asyncio.gather(*[
            _jikan_search(q, client) for q in queries
        ])

    meta_lookup: dict[int, dict] = {}

    for results in results_list:
        for anime in results:
            mid = anime.get("mal_id")
            if not mid or mid in seen_ids:
                continue
            meta_lookup[mid] = anime

            # Score by genre overlap with user profile
            anime_genres = {g["mal_id"] for g in anime.get("genres", [])}
            overlap = sum(genre_score.get(gid, 0) for gid in anime_genres)
            candidate_scores[mid] += overlap * 0.3

            # Slight bonus for score (normalised)
            score = anime.get("score") or 0
            candidate_scores[mid] += (score / 10) * 0.5

    # Merge meta from per-anime recs
    for mid, rec in getattr(candidate_scores, "_meta", {}).items():
        if mid not in meta_lookup:
            meta_lookup[mid] = rec

    # ---- 6. Rank, filter, return -----------------------------------------
    ranked = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)

    # We only return entries we have full metadata for
    output = []
    for mid, _ in ranked:
        if mid in meta_lookup and mid not in seen_ids:
            output.append(meta_lookup[mid])
        if len(output) >= 24:
            break

    # If still thin (new user with few signals), pad with popular
    if len(output) < 8:
        async with httpx.AsyncClient() as client:
            pad = await _jikan_search({
                "type": type,
                "order_by": "members",
                "sort": "desc",
                "limit": 24,
                "sfw": "true",
                "page": random.randint(1, 2),
            }, client)
        for a in pad:
            if a.get("mal_id") not in seen_ids and a not in output:
                output.append(a)
            if len(output) >= 24:
                break

    return output[:24]
