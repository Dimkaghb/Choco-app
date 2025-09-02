from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict, Any

from .models import ProcessFileResponse
from .service import file_processing_service


router = APIRouter(prefix="/file-processing", tags=["file-processing"])


@router.post("/process-file", response_model=ProcessFileResponse)
async def process_file(
    file: UploadFile = File(...)
) -> ProcessFileResponse:
    """
    Process uploaded file and return structured data for frontend to send to AI API
    
    Args:
        file: Uploaded file to process
        
    Returns:
        ProcessFileResponse with processing results
        
    Raises:
        HTTPException: If file processing fails
    """
    # Validate file type
    if not file_processing_service.validate_file_type(file.filename):
        from ..config import settings
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {settings.ALLOWED_FILE_TYPES}"
        )
    
    # Process the file
    result = await file_processing_service.process_uploaded_file(file)
    return result


@router.get("/supported-formats")
async def get_supported_formats() -> Dict[str, Any]:
    """
    Get list of supported file formats
    
    Returns:
        Dictionary containing supported file formats and limits
    """
    from ..config import settings
    
    return {
        "supported_formats": settings.ALLOWED_FILE_TYPES,
        "max_file_size_mb": settings.MAX_FILE_SIZE / (1024 * 1024),
        "max_sample_rows": settings.MAX_SAMPLE_ROWS,
        "max_text_preview": settings.MAX_TEXT_PREVIEW
    }


@router.get("/health")
async def file_processing_health() -> Dict[str, str]:
    """
    Health check endpoint for file processing service
    
    Returns:
        Health status of the file processing service
    """
    return {"status": "healthy", "service": "file-processing"}