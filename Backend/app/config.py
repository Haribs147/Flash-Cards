from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    PEPPER: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()