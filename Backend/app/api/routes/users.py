from fastapi import APIRouter, Depends
from app.api.schemas import UserOut
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter(tags=["Users"])

@router.get("/users/me", response_model=UserOut)
def read_users_me(current_user: User= Depends(get_current_user)):
    return current_user