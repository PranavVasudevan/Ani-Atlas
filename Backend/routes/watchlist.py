from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Watchlist
from auth.dependencies import get_current_user

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


class WatchRequest(BaseModel):
    anime_id: int
    status: str
    anime_title: str = ""
    anime_image: str = ""


@router.post("")
def set_watchlist(
    data: WatchRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(Watchlist).filter(
        Watchlist.user_id == user_id,
        Watchlist.anime_id == data.anime_id,
    ).first()

    if entry:
        entry.status = data.status
        # Update stored metadata if provided
        if data.anime_title:
            entry.anime_title = data.anime_title
        if data.anime_image:
            entry.anime_image = data.anime_image
    else:
        entry = Watchlist(
            user_id=user_id,
            anime_id=data.anime_id,
            status=data.status,
            anime_title=data.anime_title,
            anime_image=data.anime_image,
        )
        db.add(entry)

    db.commit()
    return {"message": "Updated"}


@router.get("")
def get_watchlist(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Watchlist).filter(Watchlist.user_id == user_id).all()


@router.delete("/{anime_id}")
def remove_watchlist(
    anime_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.query(Watchlist).filter(
        Watchlist.user_id == user_id,
        Watchlist.anime_id == anime_id,
    ).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"message": "Removed"}
