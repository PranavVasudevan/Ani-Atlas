from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    anime_id = Column(Integer, index=True)
    anime_title = Column(String)
    anime_image = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True)
    anime_id = Column(Integer, index=True)
    status = Column(String)
    anime_title = Column(String, nullable=True)
    anime_image = Column(String, nullable=True)


class Journal(Base):
    __tablename__ = "journals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True)
    anime_id = Column(Integer, index=True)
    content = Column(String)
    rating = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Tierlist(Base):
    __tablename__ = "tierlist"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    anime_id = Column(Integer, index=True)
    anime_title = Column(String)
    anime_image = Column(String)
    tier = Column(String)          # peak | great | good | mid | bad
    personal_rating = Column(Integer, nullable=True)   # 1-10
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
