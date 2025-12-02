from fastapi import APIRouter, Depends, HTTPException, Response, status

from sqlalchemy.orm import Session, joinedload

from app.api.schemas import CommentCreate, CommentOut, CommentUpdate, VoteData
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.services.comment_service import CommentService
from app.services.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.services.vote_service import VoteService

router = APIRouter(tags=["Comments"])

@router.post("/materials/{material_id}/comments", status_code=status.HTTP_201_CREATED, response_model=CommentOut)
def new_comment(
    material_id: int, 
    comment_data: CommentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(CommentService)
):
    try:
        return comment_service.create_comment(db, material_id, comment_data, current_user)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(CommentService)
):
    try:
        comment_service.delete_comment(db, comment_id, current_user)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.patch("/comments/{comment_id}", status_code=status.HTTP_200_OK, response_model=CommentOut)
def update_comment(
    comment_id: int, 
    comment_data: CommentUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(CommentService)
):
    try:
        return comment_service.update_comment(db, comment_id, comment_data, current_user)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.post("/comments/{comment_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_comment(
    comment_id: int, 
    vote_data: VoteData, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    vote_service: VoteService = Depends(VoteService)
):
    try:
        return vote_service.process_vote(
            db, current_user, comment_id, "comment", vote_data.vote_type
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)