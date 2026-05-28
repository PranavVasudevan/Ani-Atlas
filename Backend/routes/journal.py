from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Journal
from auth.dependencies import get_current_user

router = APIRouter(prefix="/journal", tags=["Journal"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class JournalRequest(BaseModel):
    anime_id: int
    content: str
    rating: int | None = None

@router.post("")
def add_journal(
    data: JournalRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = Journal(
        user_id=user_id,
        anime_id=data.anime_id,
        content=data.content,
        rating=data.rating,
    )
    db.add(entry)
    db.commit()
    return {"message": "Journal saved"}

@router.get("")
def get_my_journals(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Journal).filter(Journal.user_id == user_id).all()
