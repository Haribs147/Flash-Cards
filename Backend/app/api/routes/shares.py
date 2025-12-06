from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.schemas import MaterialOut, PendingShareOut, ShareData, ShareUpdateData, SharedUser
from app.core.security import get_current_user, validate_csrf
from app.db.database import get_db
from app.db.models import User
from app.services.exceptions import ConflictError, NotFoundError, PermissionDeniedError, ValidationError
from app.services.material_service import MaterialService
from app.services.share_service import ShareService

router = APIRouter(tags=["Sharing"])

@router.post("/materials/{item_id}/share", response_model=SharedUser, status_code=status.HTTP_201_CREATED)
def share_material(
    item_id: int, 
    share_data: ShareData, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    share_service: ShareService = Depends(ShareService),
    material_service: MaterialService = Depends(MaterialService),
    _ = Depends(validate_csrf),

):
    try:
        return share_service.share_material(db, item_id, share_data, current_user, material_service)
    except (NotFoundError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.detail)

@router.delete("/materials/{item_id}/share/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share_access(
    item_id: int, 
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    share_service: ShareService = Depends(ShareService),
    material_service: MaterialService = Depends(MaterialService),
    _ = Depends(validate_csrf),
):
    try:
        share_service.revoke_share(db, item_id, user_id, current_user, material_service)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.post("/materials/{item_id}/shares/update", status_code=status.HTTP_200_OK)
def update_shares(
    item_id: int, 
    share_update_data: ShareUpdateData, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    share_service: ShareService = Depends(ShareService),
    material_service: MaterialService = Depends(MaterialService),
    _ = Depends(validate_csrf),
):
    try:
        share_service.update_shares(db, item_id, share_update_data, current_user, material_service)
        return {"message": "Permissions updates succesfully"}
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.get("/shares/pending", response_model=list[PendingShareOut], status_code=status.HTTP_200_OK)
def get_shares(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    share_service: ShareService = Depends(ShareService),
):
    return share_service.get_pending_shares(db, current_user)

@router.post("/shares/pending/{share_id}/accept", response_model=MaterialOut)
def accept_share(
    share_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    share_service: ShareService = Depends(ShareService),
    _ = Depends(validate_csrf),
):
    try:
        return share_service.accept_share(db, share_id, current_user)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)

@router.delete("/shares/pending/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def reject_share(
    share_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    share_service: ShareService = Depends(ShareService),
    _ = Depends(validate_csrf),
):
    try:
        share_service.reject_share(db, share_id, current_user)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)