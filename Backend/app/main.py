from typing import Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from .config import settings

from .database import Material, User, get_db
from .security import get_password_hash, verify_password, create_acces_token, get_current_user


app = FastAPI(title="Flashcard_backend")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)

class CsrfSettings(BaseModel):
    secret_key: str = settings.CSRF_SECRET_KEY

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

@app.exception_handler(CsrfProtectError)
def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return Response(status_code=exc.status_code, content=exc.message)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    repeatPassword: str

class UserOut(BaseModel):
    email: EmailStr

class LoginResponse(BaseModel):
    message: str
    csrf_token: str
    user: UserOut

class Token(BaseModel):
    access_token: str
    token_type: str

class MaterialOut(BaseModel):
    id: int
    type: str
    name: str
    parent_id: int

    class Config:
        orm_mode = True

def validate_password(password: str) -> Optional[str]:
    special_characters = "!@#$%^&*()-+?_=,<>/"

    if len(password) < 8:
        return "Hasło musi mieć co najmniej 8 znaków."
    if not any (char.isdigit() for char in password):
        return "Hasło musi zawierać co najmniej jedną cyfrę."
    if not any (char.isupper() for char in password):
        return "Hasło musi zawierać co najmniej jedną wielką literę."
    if not any (char.islower() for char in password):
        return "Hasło musi zawierać co najmniej jedną małą literę."
    if not any (char in special_characters for char in password):
        return "Hasło musi zawierać co najmniej jeden znak specjalny."
    return None

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(response: Response, user_in: UserCreate, db: Session = Depends(get_db), csrf_protect: CsrfProtect = Depends()):    
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email zajęty")
    
    if user_in.password != user_in.repeatPassword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hasła się różnią")

    password_error = validate_password(user_in.password)
    if password_error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_error)

    hashed_password = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, password=hashed_password)

    db.add(new_user)
    db.commit()

    access_token = create_acces_token(data={"sub": new_user.email})
    csrf_token, signed_csrf_token = csrf_protect.generate_csrf_tokens()
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=1800)
    csrf_protect.set_csrf_cookie(signed_csrf_token, response)

    return {"message": "User registered successfully", "csrf_token": csrf_token}

@app.post("/login", response_model=LoginResponse)
def login_for_access_token(response: Response, form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db), csrf_protect: CsrfProtect = Depends()):
    db_user = db.query(User).filter(User.email == form_data.username).first()

    if not db_user or not verify_password(form_data.password, db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nieprawidłowy email lub hasło")
    
    access_token = create_acces_token(data={"sub": db_user.email})

    csrf_token, signed_csrf_token = csrf_protect.generate_csrf_tokens()
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=1800)
    
    csrf_protect.set_csrf_cookie(signed_csrf_token, response)

    return{"message": "Login succesfull", "csrf_token": csrf_token, "user": db_user}

@app.get("/users/me", response_model=UserOut)
def read_users_me(current_user: User= Depends(get_current_user)):
    return current_user

@app.get("materials/all", response_model=MaterialOut)
def get_all_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    materials = db.query(Material).filter(Material.owner.id == current_user.id).all()
    return materials