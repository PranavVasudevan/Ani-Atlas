import requests

BASE_URL = "https://api.jikan.moe/v4"

def search_anime(query, limit=5):
    url = f"{BASE_URL}/anime"
    params = {
        "q": query,
        "limit": limit
    }
    res = requests.get(url, params=params)
    res.raise_for_status()
    return res.json()["data"]
