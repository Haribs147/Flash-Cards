from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
import uuid
from fastapi import FastAPI, Depends, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel, EmailStr
from sqlalchemy import case, func, or_, and_
from sqlalchemy.orm import Session, joinedload
from elasticsearch import Elasticsearch
import enum

from .elastic_search import close_es_connection, connect_to_es, get_es_client

from .minio import initialize_minio, minio_client

from .config import settings

from .database import Flashcard, FlashcardSet, Material, MaterialShare, PermissionEnum, ShareStatusEnum, User, Vote, VoteTypeEnum, Comment, get_db
from .security import get_optional_current_user, get_password_hash, verify_password, create_acces_token, get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup")
    initialize_minio()
    connect_to_es()
    yield
    print("Application shutdown")
    close_es_connection()


app = FastAPI(title="Flashcard_backend", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)


class CsrfSettings(BaseModel):
    secret_key: str = settings.CSRF_SECRET_KEY

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

@app.exception_handler(CsrfProtectError)
def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return Response(status_code=exc.status_code, content=exc.message)

class TimePeriod(str, enum.Enum):
    day="day"
    week="week"
    month="month"
    year="year"

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
    linked_material_id: Optional[int] = None

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

class CommentOut(BaseModel):
    id: int
    text: str
    author_email: str
    created_at: datetime
    upvotes: int
    downvotes: int
    user_vote: Optional[VoteTypeEnum] = None
    replies: list["CommentOut"] = []

class FlashcardSetOut(BaseModel):
    id: int
    name: str
    description: str
    is_public: bool
    creator: str
    flashcards: list[FlashcardData]
    shared_with: list[SharedUser]
    upvotes: int
    downvotes: int
    user_vote: Optional[VoteTypeEnum] = None
    comments: list[CommentOut]

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

class VoteData(BaseModel):
    vote_type: VoteTypeEnum

class CommentCreate(BaseModel):
    text: str   
    parent_comment_id: Optional[int] = None

class CommentUpdate(BaseModel):
    text: str

class CopySet(BaseModel):
    target_folder_id: Optional[int] = None

class BasePublicSetOut(BaseModel):
    id: int
    name: str
    description: str
    creator: str
    created_at: datetime

class MostViewedSetsOut(BasePublicSetOut):
    view_count: int

class MostLikedSetsOut(BasePublicSetOut):
    like_count: int

CommentOut.model_rebuild()

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

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="fastapi-csrf-token")

    return {"message": "Logout succesful"}

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
    result = db.query(Material, FlashcardSet.is_public).join(Material, FlashcardSet.id == Material.id).filter(Material.id == item_id).first()
    #TODO make a left join here so that it is faster
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    material, is_public = result
    
    if is_public and req_access == PermissionEnum.viewer.value:
        return material

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
        # TODO it should not remove the material share, instead there should be shares view on the frontend and we should be able to create shortcuts.
        share_to_delete = db.query(MaterialShare).filter(
            MaterialShare.material_id == item_to_delete.linked_material_id,
            MaterialShare.user_id == current_user.id
        ).first()
        if share_to_delete:
            db.delete(share_to_delete)

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
def get_set(set_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_current_user), elastic_search: Elasticsearch = Depends(get_es_client)):
    # flashcard_set = db.query(FlashcardSet).options(
    #     joinedload(FlashcardSet.material).joinedload(Material.owner),
    #     joinedload(FlashcardSet.flashcards)
    # ).filter(FlashcardSet.id == set_id).first()

    # if not flashcard_set:
    #     raise HTTPException(status_code=404, detail="Flashcard set not found")

    # if flashcard_set.material.owner_id != current_user.id:
    #     raise HTTPException(status_code=403, detail="Not authorized to get this flashcard set")

    set_material = check_permission(item_id=set_id, req_access=PermissionEnum.viewer.value, current_user=current_user, db=db)
    if(set_material.item_type == "link"):
        set_material = db.query(Material).filter(Material.id == set_material.linked_material_id).first()
        set_id = set_material.id

    flashcard_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id).first()
    creator = db.query(User).filter(User.id == set_material.owner_id).first()
    shares = db.query(MaterialShare, User).join(User, MaterialShare.user_id == User.id).filter(MaterialShare.material_id == set_id).all()
    shared_with = [SharedUser(user_id=user.id, email=user.email, permission=share.permission) for share, user in shares]

    upvotes = db.query(Vote).filter(Vote.votable_id==set_id, Vote.votable_type=="material", Vote.vote_type==VoteTypeEnum.upvote).count()
    downvotes = db.query(Vote).filter(Vote.votable_id==set_id, Vote.votable_type=="material", Vote.vote_type==VoteTypeEnum.downvote).count()

    user_vote = None
    if current_user:
        user_vote_obj = db.query(Vote).filter(Vote.votable_id==set_id, Vote.votable_type=="material", Vote.user_id==current_user.id).first()
        user_vote = user_vote_obj.vote_type if user_vote_obj else None

    comments_raw = db.query(Comment, User.email).join(User, Comment.user_id==User.id).filter(Comment.material_id == set_id).order_by(Comment.created_at.desc()).all()

    comment_ids = [c.id for c, email in comments_raw]
    votes_data = {}
    if comment_ids:
        votes_summary = db.query(
            Vote.votable_id,
            func.sum(case((Vote.vote_type == VoteTypeEnum.upvote, 1), else_=0)).label("upvotes"),
            func.sum(case((Vote.vote_type == VoteTypeEnum.downvote, 1), else_=0)).label("downvotes"),
        ).filter(Vote.votable_id.in_(comment_ids), Vote.votable_type == "comment").group_by(Vote.votable_id).all()
        votes_map = {votable_id: {"upvotes": up, "downvotes": down} for votable_id, up, down in votes_summary}
        
        user_votes_map = {}
        if current_user:
            user_comment_votes = db.query(Vote).filter(Vote.votable_id.in_(comment_ids), Vote.votable_type == "comment", Vote.user_id == current_user.id).all()
            user_votes_map = {v.votable_id: v.vote_type for v in user_comment_votes}

        for comment_id in comment_ids:
            votes_data[comment_id] = {
                "upvotes": votes_map.get(comment_id, {}).get("upvotes", 0),
                "downvotes": votes_map.get(comment_id, {}).get("downvotes", 0),
                "user_vote": user_votes_map.get(comment_id)
            }

    comment_map = {
        comment.id: CommentOut(
            id=comment.id, text=comment.text, author_email=email, created_at=comment.created_at,
            **votes_data.get(comment.id, {"upvotes": 0, "downvotes": 0, "user_vote": None})
        )
        for comment, email in comments_raw
    }

    nested_comments = []
    for comment_obj, email in comments_raw:
        if comment_obj.parent_comment_id:
            parent = comment_map.get(comment_obj.parent_comment_id)
            if parent:
                parent.replies.append(comment_map[comment_obj.id])
        else:
            nested_comments.append(comment_map[comment_obj.id])

    # Add the event to elastic search
    try:
        elastic_search.index(
            index="view_events",
            document={
                "set_id": set_id,
                "timestamp": datetime.now(timezone.utc)
            },
        )
    except Exception as e:
        print(f"Error logging event view_events to elastic_search (set_id: {set_id}) error: {e}")


    flashcard_data = {
        "id": set_id,
        "name": set_material.name,
        "description": flashcard_set.description,
        "is_public": flashcard_set.is_public,
        "creator": creator.email,
        "flashcards": flashcard_set.flashcards,
        "shared_with": shared_with,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "user_vote": user_vote,
        "comments": nested_comments,
    }
    return flashcard_data

@app.post("/materials/{item_id}/share", response_model=SharedUser, status_code=status.HTTP_201_CREATED)
def share_material(item_id: int, share_data: ShareData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=item_id, req_access="owner", db=db, current_user=current_user)

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
def revoke_share_access(item_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=item_id, req_access="owner", db=db, current_user=current_user)
    
    share_to_delete =  db.query(MaterialShare).filter(MaterialShare.material_id == item_id, MaterialShare.user_id == user_id).first()
    if not share_to_delete:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This share doesn't exist.")
    
    db.delete(share_to_delete)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/materials/{item_id}/shares/update", status_code=status.HTTP_200_OK)
def update_shares(item_id: int, share_update_data: ShareUpdateData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=item_id, req_access="owner", db=db, current_user=current_user)
    
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

@app.post("/shares/pending/{share_id}/accept", response_model=MaterialOut)
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
def reject_share(share_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    share_to_delete = db.query(MaterialShare).filter(MaterialShare.id == share_id, MaterialShare.user_id == current_user.id, MaterialShare.status == ShareStatusEnum.pending).first()
    
    if not share_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")
    
    db.delete(share_to_delete)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/upload-image", status_code=status.HTTP_201_CREATED)
def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=unique_filename,
            data=file.file,
            length=-1,
            part_size=10*1024*1024,
            content_type=file.content_type,
        )

        image_url = f"http://{settings.MINIO_ENPOINT}/{settings.MINIO_BUCKET}/{unique_filename}"

        return {"url": image_url}
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload image {str(e)}")

def process_vote(votable_id: int, votable_type: int, vote_type: int, db: Session, current_user: User):
    existing_vote = db.query(Vote).filter(
        Vote.user_id==current_user.id,
        Vote.votable_id==votable_id,
        Vote.votable_type==votable_type,
    ).first()

    new_user_vote = None

    if existing_vote:
        if existing_vote.vote_type == vote_type:
            db.delete(existing_vote)
        else:
            existing_vote.vote_type = vote_type
            new_user_vote = vote_type
    else:
        new_vote = Vote(
            user_id=current_user.id,
            votable_id=votable_id,
            votable_type=votable_type,
            vote_type=vote_type,
        )
        db.add(new_vote)
        new_user_vote = vote_type

    db.commit()

    upvotes = db.query(Vote).filter(Vote.votable_id==votable_id, Vote.votable_type==votable_type, Vote.vote_type==VoteTypeEnum.upvote).count()
    downvotes = db.query(Vote).filter(Vote.votable_id==votable_id, Vote.votable_type==votable_type, Vote.vote_type==VoteTypeEnum.downvote).count()

    return {"message": "Vote Processed", "upvotes": upvotes, "downvotes": downvotes, "user_vote": new_user_vote}

@app.post("/materials/{material_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_material(material_id: int, vote_data: VoteData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    if material.item_type != "set":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Items of type `{material.item_type}` cannot be voted on",
        )

    return process_vote(
        votable_id=material_id,
        votable_type="material",
        vote_type=vote_data.vote_type,
        db=db,
        current_user=current_user
    )

@app.post("/materials/{material_id}/comments", status_code=status.HTTP_201_CREATED, response_model=CommentOut)
def new_comment(material_id: int, comment_data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    if material.item_type not in ["set"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Material of type `{material.item_type}` cannot be commented on"
        )

    if comment_data.parent_comment_id:
        parent_comment = db.query(Comment).filter(comment_data.parent_comment_id == Comment.id).first()
        if not parent_comment:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent comment not found")
        if parent_comment.parent_comment_id is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="U cannot make a reply to a reply")        

    new_commment = Comment(
        text=comment_data.text,
        user_id=current_user.id,
        material_id=material_id,
        parent_comment_id=comment_data.parent_comment_id
    )

    db.add(new_commment)
    db.commit()
    db.refresh(new_commment)

    return CommentOut(
        id=new_commment.id,
        text=new_commment.text,
        author_email=current_user.email,
        created_at=new_commment.created_at,
        upvotes=0,
        downvotes=0,
        user_vote=None,
        replies=[]
    )

@app.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment_to_delete = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if comment_to_delete.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    db.delete(comment_to_delete)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.patch("/comments/{comment_id}", status_code=status.HTTP_200_OK)
def update_comment(comment_id: int, comment_data: CommentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment_to_update = db.query(Comment).options(joinedload(Comment.author)).filter(Comment.id == comment_id).first()

    if not comment_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if comment_to_update.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this comment")
    
    comment_to_update.text = comment_data.text

    db.commit()
    db.refresh(comment_to_update)

    upvotes = db.query(Vote).filter(Vote.votable_id==comment_id, Vote.votable_type=="comment", Vote.vote_type==VoteTypeEnum.upvote).count()
    downvotes = db.query(Vote).filter(Vote.votable_id==comment_id, Vote.votable_type=="comment", Vote.vote_type==VoteTypeEnum.downvote).count()
    user_vote_obj = db.query(Vote).filter(Vote.votable_id==comment_id, Vote.votable_type=="comment", Vote.user_id==current_user.id).first()
    user_vote = user_vote_obj.vote_type if user_vote_obj else None

    replies = []
    if comment_to_update.replies:
        reply_ids = [reply.id for reply in comment_to_update.replies]
        votes_summary = db.query(
            Vote.votable_id,
            func.sum(case((Vote.vote_type == VoteTypeEnum.upvote, 1), else_=0)).label("upvotes"),
            func.sum(case((Vote.vote_type == VoteTypeEnum.downvote, 1), else_=0)).label("downvotes"),
        ).filter(Vote.votable_id.in_(reply_ids), Vote.votable_type == "comment").group_by(Vote.votable_id).all()
        votes_map = {votable_id: {"upvotes": up, "downvotes": down} for votable_id, up, down in votes_summary}
        
        user_comment_votes = db.query(Vote.votable_id, Vote.vote_type).filter(Vote.votable_id.in_(reply_ids), Vote.votable_type == "comment", Vote.user_id == current_user.id).all()
        user_votes_map = {votable_id: vote_type for votable_id, vote_type in user_comment_votes}


        for reply in comment_to_update.replies:
            counts = votes_map.get(reply.id, {"upvotes": 0, "downvotes": 0})
            user_reply_vote = user_votes_map.get(reply.id)

            replies.append(CommentOut(
                id=reply.id,
                text=reply.text,
                author_email=reply.author.email,
                created_at=reply.created_at,
                upvotes=counts["upvotes"],
                downvotes=counts["downvotes"],
                user_vote=user_reply_vote,
                replies=[]
            ))

    return CommentOut(
        id=comment_to_update.id,
        text=comment_to_update.text,
        author_email=comment_to_update.author.email,
        created_at=comment_to_update.created_at,
        upvotes=upvotes,
        downvotes=downvotes,
        user_vote=user_vote,
        replies=replies
    )

@app.post("/comments/{comment_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_material(comment_id: int, vote_data: VoteData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    return process_vote(
        votable_id=comment_id,
        votable_type="comment",
        vote_type=vote_data.vote_type,
        db=db,
        current_user=current_user
    )

@app.post("/sets/{set_id}/copy", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def copy_flashcard_set(set_id: int, copy_data: CopySet, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=set_id, req_access=PermissionEnum.viewer.value, db=db, current_user=current_user)
    
    original_material = db.query(Material).options(
        joinedload(Material.flashcard_set).joinedload(FlashcardSet.flashcards)
    ).filter(Material.id == set_id).first()

    if not original_material or not original_material.flashcard_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcardset not found")
    
    original_set = original_material.flashcard_set

    new_material = Material(
        name=f"{original_material.name} (copy)",
        item_type="set",
        owner_id=current_user.id,
        parent_id=copy_data.target_folder_id
    )

    db.add(new_material)
    db.flush()

    new_set = FlashcardSet(
        id=new_material.id,
        description=original_set.description,
        is_public=False,
    )

    db.add(new_set)

    new_flashcards = [Flashcard(front_content=card.front_content, back_content=card.back_content, set_id=new_material.id,) for card in original_set.flashcards]

    db.add_all(new_flashcards)
    db.commit()
    db.refresh(new_material)

    return new_material

@app.get("/public/sets/most_viewed", response_model=list[MostViewedSetsOut])
def get_most_viewed_sets(period: TimePeriod, db: Session = Depends(get_db), elastic_search: Elasticsearch = Depends(get_es_client)):
    public_set_ids_tuple = db.query(FlashcardSet.id).filter(FlashcardSet.is_public == True).all()
    if not public_set_ids_tuple:
        return []
    
    public_set_ids = [set[0] for set in public_set_ids_tuple]

    now = datetime.now(timezone.utc)
    if period == TimePeriod.day:
        cutoff_date = now - timedelta(days=1)
    elif period == TimePeriod.week:
        cutoff_date = now - timedelta(weeks=1)
    elif period == TimePeriod.month:
        cutoff_date = now - timedelta(days=30)
    else:
        cutoff_date = now - timedelta(days=365)
    
    query = {
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "timestamp": {
                                "gte": cutoff_date.isoformat(),
                                "lte": now.isoformat(),
                            }
                        }
                    }
                ],
                "filter": [
                    {
                        "terms":{
                            "set_id": public_set_ids
                        }
                    }
                ]
            }
            
        },
        "aggs": {
            "top_sets": {
                "terms": {
                    "field": "set_id",
                    "size": 20,
                    "order": {"_count": "desc"}
                }
            }
        }
    }

    try:
        response = elastic_search.search(index="view_events", body=query)
    except Exception as e:
        print(f"Error getting most viewed sets: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get most viewed sets")

    buckets = response["aggregations"]["top_sets"]["buckets"]
    if not buckets:
        return []
    
    set_view_counts = {bucket["key"]: bucket["doc_count"] for bucket in buckets}
    set_ids = list(set_view_counts.keys())

    set_details = db.query(Material.id, Material.name, FlashcardSet.description, User.email, Material.created_at
    ).join(
        User, Material.owner_id == User.id
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).filter(
        Material.id.in_(set_ids),
        Material.item_type == "set"
    ).all()

    results = []

    for id, name, description, email, created_at in set_details:
        results.append(MostViewedSetsOut(
            id=id,
            name=name,
            description=description,
            creator=email,
            created_at=created_at,
            view_count=set_view_counts.get(id, 0)
        ))
    
    results.sort(key=lambda x: x.view_count, reverse=True)
    return results

@app.get("/public/sets/most_liked", response_model=list[MostLikedSetsOut])
def get_most_liked_sets(period: TimePeriod, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    if period == TimePeriod.day:
        cutoff_date = now - timedelta(days=1)
    elif period == TimePeriod.week:
        cutoff_date = now - timedelta(weeks=1)
    elif period == TimePeriod.month:
        cutoff_date = now - timedelta(days=30)
    else:
        cutoff_date = now - timedelta(days=365)

    like_count = func.count(Vote.id).label("like_count")

    top_sets_query = db.query(
        Material.id,
        like_count
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).join(
        Vote, and_(
            Material.id == Vote.votable_id,
            Vote.votable_type == "material",
            Vote.vote_type == VoteTypeEnum.upvote
        ),
        isouter=True
    ).filter(
        Material.created_at >= cutoff_date,
        FlashcardSet.is_public == True
    ).group_by(
        Material.id
    ).order_by(
        like_count.desc()
    ).limit(20).all()

    if not top_sets_query:
        return []
    
    like_counts = {set_id: count for set_id, count in top_sets_query}
    set_ids = list(like_counts.keys())

    set_details = db.query(Material.id, Material.name, FlashcardSet.description, User.email, Material.created_at
    ).join(
        User, Material.owner_id == User.id
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).filter(
        Material.id.in_(set_ids),
        Material.item_type == "set"
    ).all()

    results = []
    for id, name, description, email, created_at in set_details:
        results.append(MostLikedSetsOut(
            id=id,
            name=name,
            description=description,
            creator=email,
            created_at=created_at,
            like_count=like_counts.get(id, 0)
        ))
    
    results.sort(key=lambda x: x.like_count, reverse=True)
    return results

@app.get("/public/sets/recently_created", response_model=list[BasePublicSetOut])
def get_recently_created_sets(db: Session = Depends(get_db)):
    recent_sets = db.query(Material.id, Material.name, FlashcardSet.description, Material.created_at, User.email,
    ).join(
        User, Material.owner_id == User.id
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).filter(
        FlashcardSet.is_public == True,
        Material.item_type == "set"
    ).order_by(
        Material.created_at.desc()
    ).limit(20).all()

    if not recent_sets:
        return []
    
    results = [
        BasePublicSetOut(
            id=id,
            name=name,
            description=description,
            creator=email,
            created_at=created_at
        )
        for id, name, description, created_at, email in recent_sets
    ]

    return results