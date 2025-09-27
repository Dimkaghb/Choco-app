from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class FileMetadataCreate(BaseModel):
    """File metadata creation model"""
    filename: str = Field(..., description="Original filename")
    file_key: str = Field(..., description="S3 object key/path")
    file_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., description="File size in bytes")
    user_id: str = Field(..., description="ID of the user who uploaded the file")
    chat_id: Optional[str] = Field(None, description="ID of the chat session (if applicable)")
    folder_id: Optional[str] = Field(None, description="Folder ID if uploading to a specific folder")
    description: Optional[str] = Field(None, description="Optional file description")
    tags: Optional[list[str]] = Field(default_factory=list, description="Optional tags for categorization")

class FileMetadataUpdate(BaseModel):
    """File metadata update model"""
    filename: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None

class FileMetadataResponse(BaseModel):
    """File metadata response model"""
    id: str = Field(alias="_id", serialization_alias="id")
    filename: str
    file_key: str
    file_type: Optional[str] = Field(default="application/octet-stream", description="MIME type of the file")
    file_size: int
    user_id: str
    chat_id: Optional[str] = None
    folder_id: Optional[str] = None
    description: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    download_url: Optional[str] = None  # Generated presigned URL
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        validate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class FileMetadataInDB(BaseModel):
    """File metadata model as stored in database"""
    filename: str
    file_key: str
    file_type: str
    file_size: int
    user_id: str
    chat_id: Optional[str] = None
    folder_id: Optional[str] = None
    description: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

class FileUploadRequest(BaseModel):
    """File upload request model"""
    filename: str = Field(..., description="Name of the file to upload")
    file_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., description="Size of the file in bytes")
    chat_id: Optional[str] = Field(None, description="Chat ID if uploading for a specific chat")
    folder_id: Optional[str] = Field(None, description="Folder ID if uploading to a specific folder")
    description: Optional[str] = Field(None, description="Optional file description")
    tags: Optional[list[str]] = Field(default_factory=list, description="Optional tags")

class FileUploadResponse(BaseModel):
    """File upload response model"""
    upload_url: str = Field(..., description="Presigned URL for uploading to S3")
    file_key: str = Field(..., description="S3 object key for the file")
    file_id: str = Field(..., description="Database ID for the file metadata")
    expires_in: int = Field(default=300, description="URL expiration time in seconds")

class FileListResponse(BaseModel):
    """File list response model"""
    files: list[FileMetadataResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool