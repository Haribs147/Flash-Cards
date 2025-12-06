from datetime import datetime
import enum
from typing import Annotated, Optional

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr

from app.db.models import VoteTypeEnum, PermissionEnum, VoteTypeEnum
from app.core.security import sanitize_html


SanitizedStr = Annotated[str, AfterValidator(sanitize_html)]

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

class MaterialOut(BaseModel):
    id: int
    item_type: str
    name: SanitizedStr
    parent_id: Optional[int] = None
    linked_material_id: Optional[int] = None

    class Config:
        orm_mode = True

class MaterialUpdate(BaseModel):
    parent_id: Optional[int] = None
    name: Optional[SanitizedStr] = None

class FolderCreate(BaseModel):
    name: SanitizedStr
    parent_id: Optional[int] = None

class FlashcardData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    front_content: SanitizedStr
    back_content: SanitizedStr

class FlashcardSetUpdateAndCreate(BaseModel):
    name: SanitizedStr
    description: SanitizedStr
    is_public: bool
    parent_id: Optional[int] = None
    flashcards: list[FlashcardData]

class FlashcardSetUpdate(BaseModel):
    name: SanitizedStr
    description: SanitizedStr
    is_public: bool
    flashcards: list[FlashcardData]

class SharedUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    email: SanitizedStr
    permission: PermissionEnum

class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: SanitizedStr
    author_email: SanitizedStr
    created_at: datetime
    upvotes: int
    downvotes: int
    user_vote: Optional[VoteTypeEnum] = None
    parent_id: Optional[int] = None
    replies: list[int] = []

class CommentsDataOut(BaseModel):
    comments: dict[int, CommentOut]
    top_level_comment_ids: list[int]

class FlashcardSetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: SanitizedStr
    description: SanitizedStr
    is_public: bool
    creator: SanitizedStr
    flashcards: list[FlashcardData]
    shared_with: list[SharedUser]
    upvotes: int
    downvotes: int
    user_vote: Optional[VoteTypeEnum] = None
    comments_data: CommentsDataOut

class ShareData(BaseModel):
    email: SanitizedStr
    permission: PermissionEnum

class ShareUpdate(BaseModel):
    user_id: int
    permission: PermissionEnum

class ShareUpdateData(BaseModel):
    updates: list[ShareUpdate]

class PendingShareOut(BaseModel):
    share_id: int
    material_name: SanitizedStr
    sharer_email: SanitizedStr

class VoteData(BaseModel):
    vote_type: VoteTypeEnum

class CommentCreate(BaseModel):
    text: SanitizedStr
    parent_comment_id: Optional[int] = None

class CommentUpdate(BaseModel):
    text: SanitizedStr

class CopySet(BaseModel):
    target_folder_id: Optional[int] = None

class BasePublicSetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: SanitizedStr
    description: SanitizedStr
    creator: SanitizedStr
    created_at: datetime

class MostViewedSetsOut(BasePublicSetOut):
    view_count: int

class MostLikedSetsOut(BasePublicSetOut):
    like_count: int

class LastViewedSet(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    author_initial: str
    viewed_at: datetime

class LastViewedSetsOut(BaseModel):
    sets: list[LastViewedSet]

class PublicSetSearchOut(BasePublicSetOut):
    model_config = ConfigDict(from_attributes=True)

    tags: list[str] = []

class UserMeResponse(BaseModel):
    user: UserOut
    csrf_token: str