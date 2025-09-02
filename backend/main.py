from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import json
from config import settings
from file_processor import FileProcessor

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ProcessFileResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    file_info: Optional[Dict[str, Any]] = None
    processed_data: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    return {"message": "Choco Data Processing API is running"}

@app.post("/process-file", response_model=ProcessFileResponse)
async def process_file(
    file: UploadFile = File(...)
):
    """
    Process uploaded file and return structured data for frontend to send to AI API
    """
    try:
        # Validate file size
        file_content = await file.read()
        if len(file_content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        file_info = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(file_content),
            "size_mb": round(len(file_content) / (1024*1024), 2)
        }
        
        # Process file using FileProcessor
        processed_data = FileProcessor.process_file(file_content, file.filename, file.content_type)
        
        # Clear file content from memory to optimize
        del file_content
        
        # Return processed data for frontend to handle
        return ProcessFileResponse(
            success=True,
            file_info=file_info,
            processed_data=processed_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return ProcessFileResponse(
            success=False,
            error=str(e)
        )





@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)