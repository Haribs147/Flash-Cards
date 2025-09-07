from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, create_engine, Column, Integer, String, Boolean, Enum as SQLAlchemyEnum, func
from sqlalchemy.orm import sessionmaker, declarative_base, Relationship
from .config import settings
import enum

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PermissionEnum(enum.Enum):
    viewer = "viewer"
    editor = "editor"

class ShareStatusEnum(enum.Enum):
    pending = "pending"
    accepted = "accepted"

class VoteTypeEnum(enum.Enum):
    upvote = "upvote"
    downvote = "downvote"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    materials = Relationship("Material", back_populates="owner")

class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"
    id = Column(Integer, ForeignKey("materials.id"), primary_key=True)
    description = Column(String, nullable=False)
    is_public = Column(Boolean, nullable=False)

    material = Relationship("Material", back_populates="flashcard_set")

    flashcards = Relationship("Flashcard", back_populates="set", cascade="all, delete-orphan", order_by="Flashcard.id")
    
class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    item_type = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    linked_material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)

    owner = Relationship("User", back_populates="materials")
    
    parent = Relationship("Material", remote_side=[id], back_populates="children", foreign_keys=[parent_id])
    children = Relationship("Material", back_populates="parent", cascade="all, delete-orphan", foreign_keys=[parent_id])
    
    flashcard_set = Relationship("FlashcardSet", uselist=False, back_populates="material", cascade="all, delete-orphan")

    comments = Relationship("Comment", back_populates="material", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    front_content = Column(String, nullable=False)
    back_content = Column(String, nullable=False)
    set_id = Column(Integer, ForeignKey("flashcard_sets.id"), nullable=False)

    set = Relationship("FlashcardSet", back_populates="flashcards")

class MaterialShare(Base):
    __tablename__ = "material_shares"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permission = Column(SQLAlchemyEnum(PermissionEnum), nullable=False)
    status = Column(SQLAlchemyEnum(ShareStatusEnum), nullable=False, default=ShareStatusEnum.pending)

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vote_type = Column(SQLAlchemyEnum(VoteTypeEnum), nullable=False)

    votable_id = Column(Integer, nullable=False)
    votable_type = Column(String, nullable=False)

    user = Relationship("User")

    __table_args__ = (UniqueConstraint("user_id", "votable_id", "votable_type", name="_user_votable_uc"), )

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)

    author = Relationship("User")
    material = Relationship("Material", back_populates="comments")

    parent = Relationship("Comment", remote_side=[id], back_populates="replies")
    replies = Relationship("Comment", back_populates="parent", cascade="all, delete-orphan")