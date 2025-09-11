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
    HOST: str = os.getenv("HOST", "0.0.0.0")  # Default to all interfaces for Docker, can be overridden via env
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:9002",
        "http://localhost:3000",
        "http://127.0.0.1:9002",
        "http://127.0.0.1:3000",
        "http://frontend:9002",  # Docker container name
        "http://choco-frontend:9002"  # Docker container name from compose
    ]
    
    # File Processing Configuration
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: List[str] = [
        ".csv", ".xlsx", ".xls", ".json", ".txt", ".log"
    ]
    
    
    # AI API Configuration
    AI_API_URL: str = "https://ai-platform-connect.kassen.space/connect/v1/d82fc727-bb94-4f82-848c-a9be5c779e4a/agent/run"
    AI_API_TIMEOUT: int = 600  # 10 minutes
    
    # Server Timeout Configuration
    UVICORN_TIMEOUT_KEEP_ALIVE: int = 600  # 10 minutes
    UVICORN_TIMEOUT_GRACEFUL_SHUTDOWN: int = 60  # 60 seconds
    REQUEST_TIMEOUT: int = 600  # 10 minutes for long-running operations
    
    # Database Connection Timeout
    MONGODB_CONNECT_TIMEOUT: int = 30000  # 30 seconds
    MONGODB_SERVER_SELECTION_TIMEOUT: int = 30000  # 30 seconds
    
    # Data Processing Configuration
    MAX_SAMPLE_ROWS: int = 1000
    MAX_TEXT_PREVIEW: int = 100000
    
    # Authentication Configuration
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 90
    
    # MongoDB Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "Choco")
    USERS_COLLECTION: str = os.getenv("USERS_COLLECTION", "Choco_users")
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()