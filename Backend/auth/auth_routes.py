from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import Base, engine
from app.models import User
from auth.auth_utils import (
    hash_password,
    verify_password,
    create_access_token
)
from auth.dependencies import get_db

# Create tables


router = APIRouter(prefix="/auth", tags=["Auth"])


# Pydantic Request Models


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str



# REGISTER


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully"
    }



# LOGIN


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": user.id})

    return {
        "access_token": token,
        "user_id": user.id
    }

