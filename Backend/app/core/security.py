import io
import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi_csrf_protect import CsrfProtect
from jose import JWTError, jwt
from PIL import Image, UnidentifiedImageError
import nh3
from passlib.context import CryptContext
from pydantic import AfterValidator
from sqlalchemy.orm import Session
from app.core.config import settings

from app.core.config import settings
from app.db.database import get_db
from app.db.models import User

ACCESS_TOKEN_SECRET_KEY = settings.ACCESS_TOKEN_SECRET_KEY
REFRESH_TOKEN_SECRET_KEY = settings.REFRESH_TOKEN_SECRET_KEY
PEPPER = settings.PEPPER
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1
REFRESH_TOKEN_EXPIRE_MINUTES = 5

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #argon2

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
    encoded_jwt = jwt.encode(to_encode, ACCESS_TOKEN_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, REFRESH_TOKEN_SECRET_KEY, algorithm=ALGORITHM)
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
            payload = jwt.decode(token, ACCESS_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])
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
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        token = request.cookies.get("access_token")
        if token is None:
            return None

        try:
            payload = jwt.decode(token, ACCESS_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = db.query(User).filter(User.email == username).first()
        if user is None:
            raise credentials_exception

        return user

def get_current_user_from_refresh_token(request: Request, db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token is None:
        raise credentials_exception
    
    try:
        payload = jwt.decode(refresh_token, REFRESH_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == username).first()
    if user is None:
        raise credentials_exception
    
    return user

def sanitize_html(text: str) -> str:
    allowed_tags = {
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 
        'blockquote', 'ul', 'ol', 'li', 'span', 'img', 'div'
    }
    allowed_attributes = {
        'img': {'src', 'alt'},
        'span': {'style'}, # highlighting
        'div': { 
            'data-type', # The image-grid block id
            'data-cols', # setting number of cols in img grid
            'style',     # allow inlince --cols css
        }
    }
    allowed_styles = {
        'background-color', # Highlighting
        '--cols',           # For the ImageGrid
    }
    allowed_classes = {
        '*': {
            'ProseMirror', 'ProseMirror-selectednode', 'ProseMirror-dragging',
            'is-active', 'interactive-image-wrapper', 'image-placeholder',
            'text-left', 'text-center', 'text-right', 'text-justify',
        }
        
    }
    cleaned_text = nh3.clean(
        html=text,
        tags=allowed_tags,
        attributes=allowed_attributes,
        filter_style_properties=allowed_styles,
        allowed_classes=allowed_classes,
    )
    return cleaned_text

def validate_and_sanitize_img(image: bytes) -> tuple[bytes, str, str]:
    max_file_size = 5 * 1024 * 1024 # 5MB
    allowed_formats = {
        "JPEG": "image/jpeg",
        "PNG": "image/png", 
        "GIF": "image/gif",
    }
    max_img_width = 1920
    max_img_height = 1080

    if len(image) > max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=F"Image is too large, the limit is: {max_file_size // 1024 // 1024}MB"
        )
    
    try:
        with Image.open(io.BytesIO(image)) as img:
            img_format = img.format

            if img_format not in allowed_formats:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=F"File type '{img_format}' not allowed"
                )
            
            if img.width <= 0 or img.height <= 0:
                raise UnidentifiedImageError("Image has bad size")
            
            img.thumbnail((max_img_width, max_img_height))

            io_buffer = io.BytesIO()
            mime_type = allowed_formats[img_format]
            if img_format == "JPEG" and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            img.save(io_buffer, format=img_format)
            return io_buffer.getvalue(), img_format, mime_type
    except UnidentifiedImageError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=F"The uploaded file was not an valid image"
        )

async def validate_csrf(request: Request, csrf_protect: CsrfProtect = Depends()):
    await csrf_protect.validate_csrf(request)
