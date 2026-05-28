from database import SessionLocal, engine, Base
from models import Anime

Base.metadata.create_all(bind=engine)

def seed_anime():
    db = SessionLocal()

    if db.query(Anime).first():
        print("Anime already seeded")
        return

    anime_list = [
        {
            "title": "Naruto",
            "genre": "Action",
            "year": 2002,
            "rating": 8.3,
            "mood": "hype"
        },
        {
            "title": "Attack on Titan",
            "genre": "Action",
            "year": 2013,
            "rating": 9.1,
            "mood": "dark"
        },
        {
            "title": "Your Name",
            "genre": "Romance",
            "year": 2016,
            "rating": 8.9,
            "mood": "romance"
        },
        {
            "title": "Spirited Away",
            "genre": "Fantasy",
            "year": 2001,
            "rating": 8.6,
            "mood": "comfort"
        },
        {
            "title": "Death Note",
            "genre": "Thriller",
            "year": 2006,
            "rating": 8.7,
            "mood": "dark"
        },
        {
            "title": "Haikyuu",
            "genre": "Sports",
            "year": 2014,
            "rating": 8.5,
            "mood": "hype"
        }
    ]

    for a in anime_list:
        db.add(Anime(**a))

    db.commit()
    db.close()
    print("Anime seeded successfully")

if __name__ == "__main__":
    seed_anime()
