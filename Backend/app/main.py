from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from .database import SessionLocal, User, get_db
from .security import get_password_hash, verify_password, create_acces_token, get_current_user


app = FastAPI(title="Flashcard_backend")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def is_password_strong(password: str):
    special_characters = "!@#$%^&*()-+?_=,<>/"

    if len(password) < 8:
        return False
    if not any (char.isdigit() for char in password):
        return False
    if not any (char.isupper() for char in password):
        return False
    if not any (char.islower() for char in password):
        return False
    if not any (char in special_characters for char in password):
        return False

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if not is_password_strong(user_in.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is not stron enough, it must be at least 8 characters long and contain: upper letter, lower letter, number and special character")

    hashed_password = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, password=hashed_password)

    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/login", response_model=Token)
def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == form_data.email).first()

    if not db_user or not verify_password(form_data.password, db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorecct email or password")
    
    access_token = create_acces_token(data={"sub": db_user.email})
    return{"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserCreate)
def read_users_me(current_user: User= Depends(get_current_user)):
    return current_user
