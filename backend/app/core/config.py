from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "LinguaFlow Localization Operations API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "linguaflow-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    DATABASE_URL: str = "postgresql://linguaflow:linguaflow_secure_pwd@db:5432/linguaflow_db"
    FRONTEND_ORIGIN: str = "*"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
