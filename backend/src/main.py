from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .file_processing.api import router as file_processing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print(f"Starting {settings.API_TITLE} v{settings.API_VERSION}")
    print(f"Server configuration: {settings.HOST}:{settings.PORT}")
    yield
    # Shutdown
    print("Shutting down application")


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


@app.get("/")
async def root():
    return {"message": "Choco Data Processing API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.API_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)