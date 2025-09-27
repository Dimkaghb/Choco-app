from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import List, Optional
from ..auth.dependencies import get_current_user
from ..auth.models import UserResponse
from .models import FolderCreate, FolderUpdate, FolderResponse
from .service import folder_service
from ..S3_filestorage.models import FileUploadRequest, FileUploadResponse
from ..S3_filestorage.service import file_storage_service
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/folders", tags=["folders"])

@router.post("/", response_model=FolderResponse)
async def create_folder(
    folder_data: FolderCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new folder"""
    try:
        folder = await folder_service.create_folder(folder_data, current_user.id)
        return folder
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create folder: {str(e)}"
        )

@router.get("/", response_model=List[FolderResponse])
async def get_folders(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all folders for the current user"""
    try:
        folders = await folder_service.get_folders_by_user(current_user.id)
        return folders
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get folders: {str(e)}"
        )

@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(
    folder_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific folder by ID"""
    folder = await folder_service.get_folder_by_id(folder_id, current_user.id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    return folder

@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a folder"""
    folder = await folder_service.update_folder(folder_id, folder_data, current_user.id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    return folder

@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a folder"""
    success = await folder_service.delete_folder(folder_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    return {"message": "Folder deleted successfully"}

@router.post("/{folder_id}/files/upload-url", response_model=FileUploadResponse)
async def create_folder_file_upload_url(
    folder_id: str,
    upload_request: FileUploadRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a presigned URL for uploading a file to a specific folder"""
    try:
        # Verify folder exists and belongs to user
        folder = await folder_service.get_folder_by_id(folder_id, current_user.id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        
        # Set folder_id in the upload request
        upload_request.folder_id = folder_id
        
        # Create upload URL using the file storage service
        upload_response = await file_storage_service.create_upload_url(
            upload_request, current_user.id
        )
        
        return upload_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
             detail=f"Failed to create upload URL: {str(e)}"
         )

@router.post("/{folder_id}/files/{file_id}/complete")
async def complete_folder_file_upload(
    folder_id: str,
    file_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Mark file upload as complete and add file to folder"""
    try:
        # Verify folder exists and belongs to user
        folder = await folder_service.get_folder_by_id(folder_id, current_user.id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        
        # Verify file exists and belongs to user
        file_metadata = await file_storage_service.get_file_metadata(file_id, current_user.id)
        if not file_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Add file to folder if not already present
        if file_id not in folder.fileIds:
            updated_file_ids = folder.fileIds + [file_id]
            update_data = FolderUpdate(
                name=folder.name,
                fileIds=updated_file_ids,
                type=folder.type
            )
            
            updated_folder = await folder_service.update_folder(
                folder_id, update_data, current_user.id
            )
            
            if not updated_folder:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update folder"
                )
        
        return {"message": "File successfully added to folder", "file_id": file_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete file upload: {str(e)}"
        )

@router.post("/{folder_id}/files/proxy-upload")
async def proxy_upload_to_folder(
    folder_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)
):
    """Upload file to folder through backend proxy to avoid CORS issues"""
    try:
        logger.info(f"Proxy upload to folder {folder_id} started for file: {file.filename}")
        
        # Verify folder exists and belongs to user
        folder = await folder_service.get_folder_by_id(folder_id, current_user.id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        
        # Parse tags if provided
        parsed_tags = []
        if tags:
            try:
                parsed_tags = json.loads(tags) if isinstance(tags, str) else tags
            except json.JSONDecodeError:
                parsed_tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # Read file content
        file_content = await file.read()
        logger.info(f"Read {len(file_content)} bytes from file")
        
        # Create file upload request with folder_id
        upload_request = FileUploadRequest(
            filename=file.filename,
            file_type=file.content_type or 'application/octet-stream',
            file_size=len(file_content),
            folder_id=folder_id,
            description=description,
            tags=parsed_tags
        )
        
        # Create upload URL and metadata
        upload_response = await file_storage_service.create_upload_url(upload_request, current_user.id)
        logger.info(f"Created upload URL for file: {upload_response.file_id}")
        
        # Upload file directly to S3 from backend using put_object
        from ..S3_filestorage.s3_client import s3_client, S3_BUCKET
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=upload_response.file_key,
            Body=file_content,
            ContentType=upload_request.file_type
        )
        logger.info(f"File uploaded to S3 successfully: {upload_response.file_key}")
        
        # Add file to folder if not already present
        if upload_response.file_id not in folder.fileIds:
            updated_file_ids = folder.fileIds + [upload_response.file_id]
            update_data = FolderUpdate(
                name=folder.name,
                fileIds=updated_file_ids,
                type=folder.type
            )
            
            updated_folder = await folder_service.update_folder(
                folder_id, update_data, current_user.id
            )
            
            if not updated_folder:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update folder"
                )
        
        # Get file metadata with download URL
        file_metadata = await file_storage_service.get_file_metadata(upload_response.file_id, current_user.id)
        logger.info(f"File metadata retrieved: {file_metadata.filename}")
        
        return file_metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Proxy upload to folder failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"File upload failed: {str(e)}"
        )