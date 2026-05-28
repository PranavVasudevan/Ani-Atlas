import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine
from auth.auth_routes import router as auth_router
from auth.dependencies import debug
from routes.anime import router as anime_router
from routes.favorites import router as favorites_router
from routes.journal import router as journal_router
from routes.recommendations import router as ai_router
from routes.watchlist import router as watchlist_router
from routes.tierlist import router as tierlist_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(anime_router)
app.include_router(favorites_router)
app.include_router(watchlist_router)
app.include_router(journal_router)
app.include_router(ai_router)
app.include_router(tierlist_router)
app.include_router(debug)

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "ok"}
