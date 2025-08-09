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
    item_type: str
    name: str
    parent_id: Optional[int] = None

    class Config:
        orm_mode = True

class MaterialUpdate(BaseModel):
    parent_id: Optional[int] = None
    name: Optional[str] = None

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

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

@app.get("/materials/all", response_model=list[MaterialOut])
def get_all_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    materials = db.query(Material).filter(Material.owner_id == current_user.id).all()
    return materials

@app.post("/folders", status_code=status.HTTP_201_CREATED)
def create_new_folder( folder_data: FolderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    new_material = Material(
        **folder_data.model_dump(),
        item_type="folder",
        owner_id=current_user.id
    )

    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    return new_material

@app.patch("/materials/{item_id}", response_model=MaterialOut)
def move_material(item_id: int, update_data: MaterialUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item_to_update = db.query(Material).filter(Material.id == item_id).first()

    if not item_to_update:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item_to_update.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to move this item")
    
    update_dict = update_data.model_dump(exclude_unset=True)

    if "name" in update_dict:
        item_to_update.name = update_data.name

    if "parent_id" in update_dict:
        if item_id == update_data.parent_id:
            raise HTTPException(status_code=400, detail="Cannot move folder into itself")
        item_to_update.parent_id = update_data.parent_id

    db.commit()
    db.refresh(item_to_update)
    return item_to_update

def get_all_items_to_delete(item_id: int, db: Session) -> list[int]:
    ids_to_delete = set()
    queue = [item_id]

    while queue:
        current_id = queue.pop(0)
        ids_to_delete.add(current_id)

        children = db.query(Material).filter(Material.parent_id == current_id).all()
        for child in children:
            queue.append(child.id)

    return list[ids_to_delete]



@app.delete("materials/{item_id}", status_code=status.HTTP_200_OK, response_model=list[int])
def delete_material(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item_to_delete = db.query(Material).filter(Material.id == item_id).first()
    
    if not item_to_delete:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item_to_delete.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to move this item")
    
    db.delete(item_to_delete)
    db.commit()
    
    return get_all_items_to_delete(item_id, db)