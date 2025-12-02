import io
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.security import get_current_user
from app.db.models import User
from app.services.exceptions import ServiceError, ValidationError
from app.services.media_service import MediaService

router = APIRouter(tags=["Media"])

@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user),
    media_service: MediaService = Depends(MediaService)
):
    try:
        return await media_service.upload_image(file)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.detail)