from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import get_db
from app.services.exceptions import ServiceError
from app.services.user_service import UserService
from app.api.schemas import LastViewedSetsOut, UserOut
from app.core.security import get_current_user
from app.db.models import User
from sqlalchemy.orm import Session

router = APIRouter(tags=["Users"])

@router.get("/users/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/recent-sets", response_model=LastViewedSetsOut)
def get_last_viewed_sets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(UserService),
):
    try:
        return user_service.get_last_viewed_sets(db, current_user)
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.detail)