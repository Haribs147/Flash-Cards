from datetime import datetime, timedelta, timezone
from typing import Optional
from bs4 import BeautifulSoup
from elasticsearch import Elasticsearch
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import and_, case, func, text
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from elasticsearch import Elasticsearch
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import BasePublicSetOut, CopySet, FlashcardSetOut, FlashcardSetUpdate, FlashcardSetUpdateAndCreate, MaterialOut, MostLikedSetsOut, MostViewedSetsOut, PublicSetSearchOut, TimePeriod
from app.core.security import get_current_user, get_optional_current_user
from app.db.database import get_db
from app.db.models import User
from app.external.elastic import get_es_client
from app.services.exceptions import NotFoundError, PermissionDeniedError, ServiceError
from app.services.flashcard_set_service import FlashcardSetService
from app.services.material_service import MaterialService
from app.services.public_service import PublicSetService

router = APIRouter(tags=["Flashcard Sets"])

@router.post("/sets", status_code=status.HTTP_201_CREATED, response_model=MaterialOut)
def create_new_set(
    set_data: FlashcardSetUpdateAndCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    elastic_search: Elasticsearch = Depends(get_es_client),
    set_service: FlashcardSetService = Depends(FlashcardSetService)
):
    new_material = set_service.create_set(db, set_data, current_user)
    
    background_tasks.add_task(
        set_service.generate_and_save_tags_bg,
        set_id=new_material.id,
        db=db,
        elastic_search=elastic_search,
    )
    return new_material

@router.patch("/sets/{set_id}", status_code=status.HTTP_200_OK, response_model=MaterialOut)
def update_set(
    set_id: int,
    update_set_data: FlashcardSetUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    elastic_search: Elasticsearch = Depends(get_es_client),
    set_service: FlashcardSetService = Depends(FlashcardSetService),
    material_service: MaterialService = Depends(MaterialService)
):
    try:
        set_material = set_service.update_set(db, set_id, update_set_data, current_user, material_service)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

    background_tasks.add_task(
        set_service.generate_and_save_tags_bg,
        set_id=set_material.id,
        db=db,
        elastic_search=elastic_search,
    )
    return set_material

@router.get("/sets/{set_id}", response_model=FlashcardSetOut)
def get_set(
    set_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
    set_service: FlashcardSetService = Depends(FlashcardSetService),
    material_service: MaterialService = Depends(MaterialService)
):
    try:
        return set_service.get_full_set_details(db, set_id, current_user, material_service)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except Exception as e:
        print(f"Unexpected error in get_set: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An internal error occurred")

@router.post("/sets/{set_id}/copy", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def copy_flashcard_set(
    set_id: int, 
    copy_data: CopySet, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    set_service: FlashcardSetService = Depends(FlashcardSetService),
    material_service: MaterialService = Depends(MaterialService)
):
    try:
        return set_service.copy_set(db, set_id, copy_data, current_user, material_service)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.get("/public/sets/most_viewed", response_model=list[MostViewedSetsOut])
def get_most_viewed_sets(
    period: TimePeriod, 
    db: Session = Depends(get_db),
    public_set_service: PublicSetService = Depends(PublicSetService)
):
    try:
        return public_set_service.get_most_viewed(db, period)
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.detail)

@router.get("/public/sets/most_liked", response_model=list[MostLikedSetsOut])
def get_most_liked_sets(
    period: TimePeriod, 
    db: Session = Depends(get_db),
    public_set_service: PublicSetService = Depends(PublicSetService)
):
    return public_set_service.get_most_liked(db, period)

@router.get("/public/sets/recently_created", response_model=list[BasePublicSetOut])
def get_recently_created_sets(
    db: Session = Depends(get_db),
    public_set_service: PublicSetService = Depends(PublicSetService)
):
    return public_set_service.get_recently_created(db)

@router.post("/public/search", response_model=list[PublicSetSearchOut])
def search_public_sets(
    text_query: str,
    public_set_service: PublicSetService = Depends(PublicSetService)
):
    if not text_query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query cannot be empty")
    try:
        return public_set_service.search_public_sets(text_query)
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.detail)