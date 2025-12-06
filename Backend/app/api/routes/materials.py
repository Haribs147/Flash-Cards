from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import FolderCreate, MaterialOut, MaterialUpdate, VoteData
from app.core.security import get_current_user, validate_csrf
from app.db.database import get_db
from app.db.models import User
from app.repositories import material_repository
from app.services.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.services.material_service import MaterialService
from app.services.vote_service import VoteService

router = APIRouter(tags=["Materials & Folders"])

@router.get("/materials/all", response_model=list[MaterialOut])
def get_all_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    materials = material_repository.get_all_materials_for_user(db, current_user.id)
    return materials

@router.post("/folders", status_code=status.HTTP_201_CREATED)
def create_new_folder(
    folder_data: FolderCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(MaterialService),
    _ = Depends(validate_csrf),
):
    return material_service.create_folder(db, folder_data, current_user)

@router.patch("/materials/{item_id}", response_model=MaterialOut)
def update_material(
    item_id: int, 
    update_data: MaterialUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(MaterialService),
    _ = Depends(validate_csrf),
):
    try:
        return material_service.update_material(db, item_id, update_data, current_user)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

@router.delete("/materials/{item_id}", status_code=status.HTTP_200_OK, response_model=list[int])
def delete_material(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    material_service: MaterialService = Depends(MaterialService),
    _ = Depends(validate_csrf),
):
    try:
        return material_service.delete_material(db, item_id, current_user)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.post("/materials/{material_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_material(
    material_id: int, 
    vote_data: VoteData, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    vote_service: VoteService = Depends(VoteService),
    _ = Depends(validate_csrf),
):
    try:
        return vote_service.process_vote(
            db, current_user, material_id, "material", vote_data.vote_type
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)