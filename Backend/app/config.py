from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    PEPPER: str
    CSRF_SECRET_KEY: str 
    
    MINIO_ENPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()