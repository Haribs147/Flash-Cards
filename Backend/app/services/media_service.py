from fastapi import UploadFile
from opentelemetry import trace
from app.core.security import validate_and_sanitize_img
from app.repositories import minio_repository
from app.services.exceptions import ValidationError

tracer = trace.get_tracer(__name__)

class MediaService:
    async def upload_image(self, file: UploadFile) -> dict:
        image_bytes = await file.read()
        
        try:
            with tracer.start_as_current_span(
                "pil_img_processing"
            ) as span:
                span.set_attribute(
                    "image.size_bytes", 
                    len(image_bytes)
                )
                (sanitized_image, 
                img_format, 
                mime_type) = validate_and_sanitize_img(image_bytes)
        except Exception as e:
            raise ValidationError(str(e.detail))

        with tracer.start_as_current_span("upload_to_minio"):
            image_url = minio_repository.upload_image(
                sanitized_image, 
                img_format, mime_type
            )
        
        return {"url": image_url}