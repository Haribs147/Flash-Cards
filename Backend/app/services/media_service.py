from fastapi import UploadFile

from app.core.security import validate_and_sanitize_img
from app.repositories import minio_repository
from app.services.exceptions import ValidationError


class MediaService:
    async def upload_image(self, file: UploadFile) -> dict:
        image_bytes = await file.read()
        
        try:
            sanitized_image, img_format, mime_type = validate_and_sanitize_img(image_bytes)
        except Exception as e: # Catches HTTPExceptions from the validator
            raise ValidationError(str(e.detail))

        image_url = minio_repository.upload_image(sanitized_image, img_format, mime_type)
        return {"url": image_url}