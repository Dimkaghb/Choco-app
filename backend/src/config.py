import os
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Configuration
    API_TITLE: str = "Choco Data Processing API"
    API_VERSION: str = "1.0.0"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:9002",
        "http://localhost:3000",
        "http://127.0.0.1:9002",
        "http://127.0.0.1:3000"
    ]
    
    # File Processing Configuration
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: List[str] = [
        ".csv", ".xlsx", ".xls", ".json", ".txt", ".log"
    ]
    
    # AI API Configuration
    AI_API_URL: str = "https://ai-platform-connect.kassen.space/connect/v1/d82fc727-bb94-4f82-848c-a9be5c779e4a/agent/run"
    AI_API_TIMEOUT: int = 180  # 3 minutes
    
    # Data Processing Configuration
    MAX_SAMPLE_ROWS: int = 10
    MAX_TEXT_PREVIEW: int = 1000
    
    # Authentication Configuration
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 90
    
    # MongoDB Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "Choco"
    USERS_COLLECTION: str = "Choco_users"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()