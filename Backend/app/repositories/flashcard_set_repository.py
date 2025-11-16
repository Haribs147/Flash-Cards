from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.api.schemas import FlashcardSetUpdate, FlashcardSetUpdateAndCreate
from app.db.models import Flashcard, FlashcardSet, Material, User, Vote, VoteTypeEnum

def get_set_by_id(db: Session, set_id: int) -> FlashcardSet | None:
    return db.query(FlashcardSet).filter(FlashcardSet.id == set_id).first()

def create_flashcard_set(db: Session, set_id: int, data: FlashcardSetUpdateAndCreate) -> FlashcardSet:
    new_set = FlashcardSet(
        id=set_id,
        description=data.description,
        is_public=data.is_public,
    )
    db.add(new_set)

    new_flashcards = [
        Flashcard(
            set_id=set_id,
            front_content=data.front_content,
            back_content=data.back_content,
        ) for card in data.flashcards
    ]
    db.add_all(new_flashcards)
    db.commit()
    return new_set

def update_flashcard_set(db: Session, flashcard_set: FlashcardSet, data: FlashcardSetUpdate) -> FlashcardSet:
    flashcard_set.description = data.description
    flashcard_set.is_public = data.is_public
    
    existing_cards = {card.id: card for card in flashcard_set.flashcards}
    incoming_cards = {card.id for card in data.flashcards if card.id is not None}

    for card_id, card in existing_cards.items():
        if card_id not in incoming_cards:
            db.delete(card)

    for card in data.flashcards:
        if card.id is not None and card.id in existing_cards:
            card_to_update = existing_cards[card.id]
            card_to_update.front_content = card.front_content
            card_to_update.back_content = card.back_content
        elif card.id is None:
            new_flashcard = Flashcard(
                set_id=flashcard_set.id,
                front_content=card.front_content,
                back_content=card.back_content,
            )
            db.add(new_flashcard)

    db.commit()
    return flashcard_set

def get_public_set_ids(db: Session) -> list[int]:
    return [id for id in db.query(FlashcardSet.id).filter(FlashcardSet.is_public == True).all()]

def get_most_liked_sets(db: Session, cutoff_date: datetime) -> list[tuple[int, int]]:
    like_count = func.count(Vote.id).label("like_count")

    return db.query(
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

def get_recently_created_sets(db: Session) -> list[tuple[int, str, str, datetime, str]]:
    return db.query(
        Material.id,
        Material.name,
        FlashcardSet.description,
        Material.created_at,
        User.email,
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
