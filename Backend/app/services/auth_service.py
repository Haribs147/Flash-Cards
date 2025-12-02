from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from app.core.security import verify_password
from app.api.schemas import UserCreate
from app.db.models import User
from app.repositories import user_repository
from app.services.exceptions import ConflictError, PermissionDeniedError, ValidationError

def validate_password_strength(password: str) -> Optional[str]:
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

class AuthService:
    def register_user(
        self,
        db: Session,
        user_in: UserCreate
    ) -> User:
        if user_repository.get_user_by_email(db, user_in.email):
            raise ConflictError("Email zajęty")
        if user_in.password != user_in.repeatPassword:
            raise ValidationError("Hasła się różnią")
        
        validate_password_strength(user_in.password)

        return user_repository.create_user(db, user_in.email, user_in.password)

    def login_user(
        self,
        db: Session,
        form_data: OAuth2PasswordRequestForm
    ) -> User:
        user = user_repository.get_user_by_email(db, form_data.username)

        if not user or not verify_password(form_data.password, user.password):
            raise PermissionDeniedError("Nieprawidłowy email lub hasło")
        
        return user