from fastapi import Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from auth.auth_utils import decode_token
from fastapi import Header
from fastapi import APIRouter, Request

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: str | None = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload["user_id"]


debug = APIRouter()

@debug.get("/__debug_auth")
async def debug_auth(request: Request):
    return {
        "headers": dict(request.headers)
    }


