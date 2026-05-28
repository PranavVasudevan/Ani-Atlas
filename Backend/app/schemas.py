from pydantic import BaseModel

class AnimeOut(BaseModel):
    id: int
    title: str
    image: str
    rating: float
    genre: str
    mood: str
