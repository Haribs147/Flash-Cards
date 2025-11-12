import io
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.security import get_current_user, validate_and_sanitize_img
from app.db.models import User
from app.external.minio import minio_client
from app.core.config import settings


router = APIRouter(tags=["Media"])

@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    image = await file.read()

    sanitized_image, img_format, mime_type = validate_and_sanitize_img(image)

    try:
        file_extension = img_format.lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=unique_filename,    
            data=io.BytesIO(sanitized_image),
            length=len(sanitized_image),
            content_type=mime_type,
        )

        image_url = f"{settings.MINIO_PUBLIC_URL}/{settings.MINIO_BUCKET}/{unique_filename}"

        return {"url": image_url}
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload image {str(e)}")

