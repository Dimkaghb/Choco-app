from pydantic import BaseModel
from typing import Optional, Dict, Any


class ProcessFileRequest(BaseModel):
    """Request model for file processing"""
    # File will be handled as UploadFile in FastAPI
    pass


class ProcessFileResponse(BaseModel):
    """Response model for file processing"""
    success: bool
    error: Optional[str] = None
    file_info: Optional[Dict[str, Any]] = None
    processed_data: Optional[Dict[str, Any]] = None


class FileInfo(BaseModel):
    """File information model"""
    filename: str
    content_type: str
    size: int
    extension: str


class ProcessedData(BaseModel):
    """Processed data model"""
    data_type: str
    summary: Dict[str, Any]
    sample_data: Optional[Any] = None
    metadata: Optional[Dict[str, Any]] = None