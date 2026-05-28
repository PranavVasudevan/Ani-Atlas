from database import SessionLocal
from models import Anime

db = SessionLocal()

anime_list = [
    Anime(title="Attack on Titan", genre="Action", year=2013, rating=9.1, mood="dark"),
    Anime(title="Naruto", genre="Shounen", year=2002, rating=8.5, mood="hype"),
    Anime(title="Your Name", genre="Romance", year=2016, rating=8.9, mood="comfort"),
    Anime(title="Death Note", genre="Thriller", year=2006, rating=9.0, mood="dark"),
    Anime(title="Haikyuu", genre="Sports", year=2014, rating=8.7, mood="hype"),
]

db.add_all(anime_list)
db.commit()
db.close()

print("Anime seeded successfully")
from database import SessionLocal
from models import Anime

db = SessionLocal()

anime_list = [
    Anime(title="Attack on Titan", genre="Action", year=2013, rating=9.1, mood="dark"),
    Anime(title="Naruto", genre="Shounen", year=2002, rating=8.5, mood="hype"),
    Anime(title="Your Name", genre="Romance", year=2016, rating=8.9, mood="comfort"),
    Anime(title="Death Note", genre="Thriller", year=2006, rating=9.0, mood="dark"),
    Anime(title="Haikyuu", genre="Sports", year=2014, rating=8.7, mood="hype"),
]

db.add_all(anime_list)
db.commit()
db.close()

print("Anime seeded successfully")
