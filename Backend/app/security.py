import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from .database import SessionLocal, User, get_db
from .config import settings
from sqlalchemy.orm import Session

SECRET_KEY = settings.SECRET_KEY
PEPPER = settings.PEPPER
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_with_pepper = plain_password + PEPPER
    return pwd_context.verify(password_with_pepper, hashed_password)

def get_password_hash(password: str) -> str:
    password_with_pepper = password + PEPPER
    return pwd_context.hash(password_with_pepper)

def create_acces_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        token = request.cookies.get("access_token")
        if token is None:
            raise credentials_exception

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = db.query(User).filter(User.email == username).first()
        if user is None:
            raise credentials_exception
        return user

def get_optional_current_user(request: Request, db: Session = Depends(get_db)):
        token = request.cookies.get("access_token")
        if token is None:
            return None

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username is None:
                return None
        except JWTError:
            return None

        user = db.query(User).filter(User.email == username).first()

        return user