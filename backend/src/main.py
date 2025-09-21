from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from .config import settings
from .file_processing.api import router as file_processing_router
from .auth.api import router as auth_router
from .chat.api import router as chat_router
from .report.api import router as report_router
from .ai.api import router as ai_router
from .auth.database import connect_to_mongo, close_mongo_connection
from .chat.database import create_indexes
from .report.async_service import async_report_service
from .S3_filestorage.api import router as file_storage_router
from .S3_filestorage.service import file_storage_service
from fastapi import Query



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
    print(f"Server configuration: {settings.HOST}:{settings.PORT}")
    
    # Connect to MongoDB
    try:
        await connect_to_mongo()
        print("MongoDB connection established")
        
        # Create database indexes
        await create_indexes()
        print("Database indexes created")
        
        # Start report cleanup task
        asyncio.create_task(async_report_service.start_cleanup_task())
        print("Report cleanup task started")
        
        # Create file storage indexes
        await file_storage_service.create_indexes()
        print("File storage indexes created")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise e
    
    yield
    
    # Shutdown
    print("Shutting down application")
    await close_mongo_connection()


app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    lifespan=lifespan
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(file_processing_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(report_router)
app.include_router(ai_router)
app.include_router(file_storage_router)


@app.get("/")
async def root():
    return {"message": "Choco Data Processing API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.API_VERSION}


# Legacy S3 endpoints have been moved to /files/ router
# These endpoints are now handled by the file_storage_router with authentication


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app", 
        host=settings.HOST, 
        port=settings.PORT,
        timeout_keep_alive=settings.UVICORN_TIMEOUT_KEEP_ALIVE,
        timeout_graceful_shutdown=settings.UVICORN_TIMEOUT_GRACEFUL_SHUTDOWN,
        reload=True,  # Auto-reload on changes
        access_log=True,  # Enable access logging
        log_level="info"  # Set log level
    )