from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.models import User

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, email: str, password: str) -> User:
    hashed_password = get_password_hash(password)
    new_user = User(email=email, password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user