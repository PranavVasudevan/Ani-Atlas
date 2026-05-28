import asyncio
from prisma import Prisma
from jikan_client import search_anime



# ---------------- MOOD INFERENCE ----------------
def infer_mood(genres: list[str]) -> str:
    g = [x.lower() for x in genres]

    # Dark has highest priority
    if any(x in g for x in ["psychological", "thriller", "horror", "mystery"]):
        return "Dark"

    # Chill must come BEFORE Emotional
    if any(x in g for x in ["slice of life", "comedy"]):
        return "Chill"

    if any(x in g for x in ["romance", "drama"]):
        return "Emotional"

    if any(x in g for x in ["action", "sports", "shounen", "adventure"]):
        return "Hype"

    return "Neutral"




# ---------------- IMPORT FUNCTION ----------------
async def import_anime(query: str):
    db = Prisma()
    await db.connect()

    anime_list = search_anime(query)

    for a in anime_list:
        try:
            # STEP 3: extract genres
            genres = [g["name"] for g in a.get("genres", [])]

            # STEP 4: infer mood from genres
            mood = infer_mood(genres)

            # STEP 5: save everything
            await db.anime.create(
                data={
                    "malId": a["mal_id"],
                    "title": a["title"],
                    "synopsis": a.get("synopsis") or "",
                    "posterUrl": a["images"]["jpg"]["image_url"],
                    "externalScore": a.get("score"),
                    "genres": genres,   
                    "mood": mood        
                }
            )

        except Exception:
            # Duplicate MAL ID
            pass

    await db.disconnect()


# ---------------- TEST ----------------
if __name__ == "__main__":
    asyncio.run(import_anime("evangelion"))
