#!/usr/bin/env python3
"""
Startup script for the Choco Data Processing API
"""

import uvicorn
from config import settings

if __name__ == "__main__":
    print(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
    print(f"Server will run on {settings.HOST}:{settings.PORT}")
    print(f"Allowed origins: {settings.ALLOWED_ORIGINS}")
    print(f"Max file size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB")
    print(f"Allowed file types: {settings.ALLOWED_FILE_TYPES}")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )