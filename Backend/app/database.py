import os
from sqlalchemy import ForeignKey, create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Relationship
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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

    flashcards = Relationship("Flashcard", back_populates="set", cascade="all, delete-orphan")
    
class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    item_type = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("materials.id"), nullable=True)

    owner = Relationship("User", back_populates="materials")
    
    parent = Relationship("Material", remote_side=[id], back_populates="children")
    children = Relationship("Material", back_populates="parent", cascade="all, delete-orphan")
    
    flashcard_set = Relationship("FlashcardSet", uselist=False, back_populates="material", cascade="all, delete-orphan")


class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    front_content = Column(String, nullable=False)
    back_content = Column(String, nullable=False)
    set_id = Column(Integer, ForeignKey("flashcard_sets.id"), nullable=False)

    set = Relationship("FlashcardSet", back_populates="flashcards")