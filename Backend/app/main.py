from typing import Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload

from .config import settings

from .database import Flashcard, FlashcardSet, Material, MaterialShare, PermissionEnum, ShareStatusEnum, User, get_db
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

class FlashcardData(BaseModel):
    id: Optional[int] = None
    front_content: str
    back_content: str

class FlashcardSetUpdateAndCreate(BaseModel):
    name: str
    description: str
    is_public: bool
    parent_id: Optional[int] = None
    flashcards: list[FlashcardData]

class FlashcardSetUpdate(BaseModel):
    name: str
    description: str
    is_public: bool
    flashcards: list[FlashcardData]

class SharedUser(BaseModel):
    user_id: int
    email: EmailStr
    permission: PermissionEnum

class FlashcardSetOut(BaseModel):
    id: int
    name: str
    description: str
    is_public: bool
    creator: str
    flashcards: list[FlashcardData]
    shared_with: list[SharedUser]

class ShareData(BaseModel):
    email: EmailStr
    permission: PermissionEnum

class ShareUpdate(BaseModel):
    user_id: int
    permission: PermissionEnum

class ShareUpdateData(BaseModel):
    updates: list[ShareUpdate]

class PendingShareOut(BaseModel):
    share_id: int
    material_name: str
    sharer_email: str

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

def check_permission(item_id: int, req_access: str, db: Session, current_user: User) -> Material:
    material = db.query(Material).filter(Material.id == item_id).first()
    #TODO make a left join here so that it is faster
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    if material.owner_id == current_user.id:
        return material
    
    share = db.query(MaterialShare).filter(item_id == MaterialShare.material_id, MaterialShare.user_id == current_user.id).first()
    if not share or share.status != ShareStatusEnum.accepted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this material")

    permission = share.permission
    if req_access == PermissionEnum.viewer.value and permission in [PermissionEnum.viewer, PermissionEnum.editor]:
        return material
    
    if req_access == PermissionEnum.editor.value and permission == PermissionEnum.editor:
        return material
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permission")

@app.patch("/materials/{item_id}", response_model=MaterialOut)
def update_material(item_id: int, update_data: MaterialUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item_to_update = db.query(Material).filter(Material.id == item_id).first()

    if not item_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    if item_to_update.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this item")
    
    update_dict = update_data.model_dump(exclude_unset=True)

    if "name" in update_dict:
        item_to_update.name = update_data.name

    if "parent_id" in update_dict:
        if item_id == update_data.parent_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot move folder into itself")
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

    return list(ids_to_delete)

@app.delete("/materials/{item_id}", status_code=status.HTTP_200_OK, response_model=list[int])
def delete_material(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item_to_delete = db.query(Material).filter(Material.id == item_id).first()
    
    if not item_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    if item_to_delete.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this item")
    
    if item_to_delete.item_type == "link":
        db.delete(item_to_delete)
        db.commit()
        return [item_id]

    db.delete(item_to_delete)
    db.commit()
    
    return get_all_items_to_delete(item_id, db)

@app.post("/sets", status_code=status.HTTP_201_CREATED, response_model=MaterialOut)
def create_new_set(set_data: FlashcardSetUpdateAndCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_material = Material(
        name=set_data.name,
        parent_id=set_data.parent_id,
        item_type="set",
        owner_id=current_user.id,
    )

    db.add(new_material)
    db.commit()
    db.refresh(new_material)

    new_flashcard_set = FlashcardSet(
        id=new_material.id,
        description=set_data.description,
        is_public=set_data.is_public,
    )

    for card_data in set_data.flashcards:
        new_card = Flashcard(
            set_id=new_material.id,
            front_content=card_data.front_content,
            back_content=card_data.back_content
        )
        db.add(new_card)

    db.add(new_flashcard_set)
    db.commit()
    return new_material


@app.patch("/sets/{set_id}", status_code=status.HTTP_200_OK, response_model=MaterialOut)
def update_set(set_id: int, update_set_data: FlashcardSetUpdate, db: Session=Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=set_id, req_access=PermissionEnum.editor.value, current_user=current_user, db=db)

    set_material = db.query(Material).options(
        joinedload(Material.flashcard_set).joinedload(FlashcardSet.flashcards)
    ).filter(Material.id == set_id).first()

    if not set_material:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    set_material.name = update_set_data.name

    flashcard_set = set_material.flashcard_set
    flashcard_set.description = update_set_data.description
    flashcard_set.is_public = update_set_data.is_public
    
    existing_cards = {card.id: card for card in flashcard_set.flashcards}
    incoming_cards = {card.id for card in update_set_data.flashcards if card.id is not None}

    for card_id, card in existing_cards.items():
        if card_id not in incoming_cards:
            db.delete(card)

    for card in update_set_data.flashcards:
        if card.id is not None and card.id in existing_cards:
            card_to_update = existing_cards[card.id]
            card_to_update.front_content = card.front_content
            card_to_update.back_content = card.back_content
        elif card.id is None:
            new_flashcard = Flashcard(
                set_id=set_id,
                front_content=card.front_content,
                back_content=card.back_content,
            )
            db.add(new_flashcard)
    
    db.commit()
    db.refresh(set_material)
    return set_material

@app.get("/sets/{set_id}", response_model=FlashcardSetOut)
def get_set(set_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # flashcard_set = db.query(FlashcardSet).options(
    #     joinedload(FlashcardSet.material).joinedload(Material.owner),
    #     joinedload(FlashcardSet.flashcards)
    # ).filter(FlashcardSet.id == set_id).first()

    # if not flashcard_set:
    #     raise HTTPException(status_code=404, detail="Flashcard set not found")

    # if flashcard_set.material.owner_id != current_user.id:
    #     raise HTTPException(status_code=403, detail="Not authorized to get this flashcard set")

    set_material = check_permission(item_id=set_id, req_access=PermissionEnum.viewer.value, current_user=current_user, db=db)
    
    flashcard_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id).first()
    creator = db.query(User).filter(User.id == set_material.owner_id).first()
    shares = db.query(MaterialShare, User).join(User, MaterialShare.user_id == User.id).filter(MaterialShare.material_id == set_id).all()
    shared_with = [SharedUser(user_id=user.id, email=user.email, permission=share.permission) for share, user in shares]

    flashcard_data = {
        "id": set_id,
        "name": set_material.name,
        "description": flashcard_set.description,
        "is_public": flashcard_set.is_public,
        "creator": creator.email,
        "flashcards": flashcard_set.flashcards,
        "shared_with": shared_with,
    }
    return flashcard_data

@app.post("/materials/{item_id}/share", response_model=SharedUser, status_code=status.HTTP_201_CREATED)
def share_material(item_id: int, share_data: ShareData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material_to_share = db.query(Material).filter(Material.id == item_id).first()
    if not material_to_share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Set not found")
    
    if material_to_share.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add this share permission")
    
    user_to_share_with = db.query(User).filter(User.email == share_data.email).first()
    if not user_to_share_with:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with email: {share_data.email} not found")
    if user_to_share_with.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot share set with yourself")
    
    existing_share = db.query(MaterialShare).filter(MaterialShare.material_id == item_id, MaterialShare.user_id == user_to_share_with.id).first()
    if existing_share:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This material is already shared with this user.")
    
    new_share = MaterialShare(material_id=item_id, user_id=user_to_share_with.id, permission=share_data.permission)
    db.add(new_share)
    db.commit()
    db.refresh(new_share)
    return SharedUser(user_id=user_to_share_with.id, email=user_to_share_with.email, permission=new_share.permission)

@app.delete("/materials/{item_id}/share/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def share_delete(item_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material_to_delete = db.query(Material).filter(Material.id == item_id).first()
    if not material_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Set not found")
    
    if material_to_delete.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this share permission")
    
    share_to_delete =  db.query(MaterialShare).filter(MaterialShare.material_id == item_id, MaterialShare.user_id == user_id).first()
    if not share_to_delete:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This share doesn't exist.")
    
    db.delete(share_to_delete)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/materials/{item_id}/shares/update", status_code=status.HTTP_200_OK)
def shares_update(item_id: int, share_update_data: ShareUpdateData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material_to_delete = db.query(Material).filter(Material.id == item_id).first()
    if not material_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Set not found")
    
    if material_to_delete.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this share permission")
    
    for update in share_update_data.updates:
        db.query(MaterialShare).filter(MaterialShare.material_id == item_id, MaterialShare.user_id == update.user_id).update({"permission": update.permission})
    
    db.commit()
    return {"message": "Permissions updates succesfully"}


@app.get("/shares/pending", status_code=status.HTTP_200_OK)
def get_shares(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pending_shares = db.query(
        MaterialShare.id, Material.name, User.email
    ).join(Material, MaterialShare.material_id == Material.id)\
     .join(User, Material.owner_id == User.id)\
     .filter( MaterialShare.user_id == current_user.id, MaterialShare.status == ShareStatusEnum.pending
    ).all()

    return [
        PendingShareOut(share_id=share_id, material_name=material_name, sharer_email=sharer_email)
        for share_id, material_name, sharer_email in pending_shares
    ]

@app.post("/shares/pending/{share_id}/accept", response_model=PendingShareOut)
def accept_share(share_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    share = db.query(MaterialShare).filter(MaterialShare.id == share_id, MaterialShare.user_id == current_user.id, MaterialShare.status == ShareStatusEnum.pending).first()

    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")
    
    original_material = db.query(Material).filter(Material.id == share.material_id).first()
    if not original_material:
        db.delete(share)
        db.commit()
        raise HTTPException(status_code=404, detail="Original material doesn't exist")
    
    link_material = Material(
        name=original_material.name,
        item_type="link",
        owner_id=current_user.id,
        parent_id=None, # TODO make it so that the user will send a parent_id
        linked_material_id = original_material.id
    )
    db.add(link_material)
    share.status = ShareStatusEnum.accepted
    db.commit()
    db.refresh(link_material)

    return link_material

@app.delete("/shares/pending/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def share_delete(share_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    share_to_delete = db.query(MaterialShare).filter(MaterialShare.id == share_id, MaterialShare.user_id == current_user.id, MaterialShare.status == ShareStatusEnum.pending).first()
    
    if not share_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")
    
    db.delete(share_to_delete)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

