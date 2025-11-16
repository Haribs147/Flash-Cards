import io
import uuid
from app.services.exceptions import ServiceError
from app.external.minio import minio_client
from app.core.config import settings

def upload_image(
    image_bytes: bytes,
    file_extension: str,
    mime_type: str,
) -> str:

    try:
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=unique_filename,    
            data=io.BytesIO(image_bytes),
            length=len(image_bytes),
            content_type=mime_type,
        )

        return f"{settings.MINIO_PUBLIC_URL}/{settings.MINIO_BUCKET}/{unique_filename}"    
    except Exception as e:
        print(f"Failed to upload an image to Minio: {e}")
        raise ServiceError(f"Failed to upload image {str(e)}")