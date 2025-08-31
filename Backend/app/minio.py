import json
from minio import Minio
from minio.error import S3Error
from .config import settings

minio_client = Minio(
    settings.MINIO_ENPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False # CHANGE WHEN HTTPS 
)

def initialize_minio():
    try:
        bucket = minio_client.bucket_exists(settings.MINIO_BUCKET)
        if not bucket:
            minio_client.make_bucket(settings.MINIO_BUCKET)
            print(f"Bucket {settings.MINIO_BUCKET} created")

            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal":{"AWS": "*"},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET}/*"],
                    }
                ],
            }
            minio_client.set_bucket_policy(settings.MINIO_BUCKET, json.dumps(policy))
            print("Bucket is set to public read")
        else:
            print(f"Bucket {settings.MINIO_BUCKET} already exists")

    except S3Error as exc:
        print("Error initializing minio", exc)