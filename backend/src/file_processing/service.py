import pandas as pd
import json
import io
from typing import Dict, Any, List
from pathlib import Path
from fastapi import HTTPException, UploadFile

from ..config import settings
from .models import ProcessFileResponse, FileInfo, ProcessedData
from .utils import FileProcessor


class FileProcessingService:
    """Business logic for file processing operations"""
    
    def __init__(self):
        self.file_processor = FileProcessor()
    
    async def process_uploaded_file(self, file: UploadFile, prompt: str = "Extract and analyze file content") -> ProcessFileResponse:
        """
        Process uploaded file and return structured data
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            ProcessFileResponse with processing results
        """
        try:
            # Read file content
            file_content = await file.read()
            
            # Validate file size
            if len(file_content) > settings.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
                )
            
            # Create file info
            file_info = {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content),
                "extension": Path(file.filename).suffix.lower()
            }
            
            # Process file content asynchronously
            processed_data = await self.file_processor.process_file(
                file_content, file.filename, file.content_type
            )
            
            return ProcessFileResponse(
                success=True,
                file_info=file_info,
                processed_data=processed_data
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            return ProcessFileResponse(
                success=False,
                error=f"Error processing file: {str(e)}"
            )
    
    def validate_file_type(self, filename: str) -> bool:
        """
        Validate if file type is allowed
        
        Args:
            filename: Name of the file
            
        Returns:
            True if file type is allowed, False otherwise
        """
        file_extension = Path(filename).suffix.lower()
        return file_extension in settings.ALLOWED_FILE_TYPES
    
    def get_file_info(self, file: UploadFile) -> FileInfo:
        """
        Extract file information
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            FileInfo object with file details
        """
        return FileInfo(
            filename=file.filename,
            content_type=file.content_type,
            size=file.size if hasattr(file, 'size') else 0,
            extension=Path(file.filename).suffix.lower()
        )


# Service instance
file_processing_service = FileProcessingService()