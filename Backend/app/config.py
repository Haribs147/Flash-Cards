from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    ACCESS_TOKEN_SECRET_KEY: str
    REFRESH_TOKEN_SECRET_KEY: str
    PEPPER: str
    CSRF_SECRET_KEY: str 
    
    MINIO_ENPOINT: str
    MINIO_PUBLIC_URL: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str

    ELASTICSEARCH_HOST: str
    ELASTICSEARCH_PORT: int
    ELASTICSEARCH_USERNAME: str
    ELASTICSEARCH_PASSWORD: str

    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")


settings = Settings()