from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Tierlist
from auth.dependencies import get_current_user

router = APIRouter(prefix="/tierlist", tags=["Tierlist"])

VALID_TIERS = {"peak", "great", "good", "mid", "bad"}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TierlistRequest(BaseModel):
    anime_id: int
    anime_title: str
    anime_image: str
    tier: str
    personal_rating: Optional[int] = None
    comment: Optional[str] = None


@router.post("")
def upsert_tierlist(
    data: TierlistRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.tier not in VALID_TIERS:
        raise HTTPException(status_code=400, detail=f"tier must be one of {VALID_TIERS}")
    if data.personal_rating is not None and not (1 <= data.personal_rating <= 10):
        raise HTTPException(status_code=400, detail="personal_rating must be 1-10")

    existing = (
        db.query(Tierlist)
        .filter(Tierlist.user_id == user_id, Tierlist.anime_id == data.anime_id)
        .first()
    )

    if existing:
        existing.tier = data.tier
        existing.personal_rating = data.personal_rating
        existing.comment = data.comment
        existing.anime_title = data.anime_title
        existing.anime_image = data.anime_image
        existing.updated_at = datetime.utcnow()
    else:
        entry = Tierlist(
            user_id=user_id,
            anime_id=data.anime_id,
            anime_title=data.anime_title,
            anime_image=data.anime_image,
            tier=data.tier,
            personal_rating=data.personal_rating,
            comment=data.comment,
        )
        db.add(entry)

    db.commit()
    return {"message": "Tierlist saved"}


@router.get("")
def get_tierlist(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Tierlist).filter(Tierlist.user_id == user_id).all()


@router.delete("/{anime_id}")
def remove_from_tierlist(
    anime_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(Tierlist)
        .filter(Tierlist.user_id == user_id, Tierlist.anime_id == anime_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"message": "Removed from tierlist"}
