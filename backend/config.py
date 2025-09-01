import os
from typing import List

class Settings:
    # API Configuration
    API_TITLE: str = "Choco Data Processing API"
    API_VERSION: str = "1.0.0"
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
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
    # Use the actual AI API endpoint from environment or fallback to the real API
    DEFAULT_AI_API_URL: str = os.getenv("AI_API_URL", "https://ai-platform-connect.kassen.space/connect/v1/d82fc727-bb94-4f82-848c-a9be5c779e4a/agent/run")
    AI_API_TIMEOUT: int = int(os.getenv("AI_API_TIMEOUT", "180"))  # Increased to 3 minutes
    
    # Data Processing Configuration
    MAX_SAMPLE_ROWS: int = 10
    MAX_TEXT_PREVIEW: int = 1000
    
settings = Settings()