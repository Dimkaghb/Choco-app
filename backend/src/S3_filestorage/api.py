from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile, Form
from typing import Optional
from ..auth.dependencies import get_current_user
from .models import (
    FileUploadRequest, FileUploadResponse, FileMetadataResponse,
    FileMetadataUpdate
)
from .service import file_storage_service
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["File Storage"])

@router.post("/upload-url", response_model=FileUploadResponse)
async def create_upload_url(
    request: FileUploadRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a presigned URL for file upload and store metadata in database.
    The file will be uploaded directly to S3 using the returned URL.
    """
    try:
        user_id = str(current_user.id)
        result = await file_storage_service.create_upload_url(request, user_id)
        return result
    except Exception as e:
        logger.error(f"Error creating upload URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create upload URL: {str(e)}"
        )

@router.get("/metadata/{file_id}", response_model=FileMetadataResponse)
async def get_file_metadata(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get file metadata and download URL by file ID.
    Only the file owner can access the metadata.
    """
    try:
        user_id = str(current_user.id)
        file_metadata = await file_storage_service.get_file_metadata(file_id, user_id)
        
        if not file_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        return file_metadata
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file metadata: {str(e)}"
        )

@router.get("/list")
async def list_user_files(
    chat_id: Optional[str] = Query(None, description="Filter by chat ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """
    List files for the current user with optional chat filtering and pagination.
    """
    try:
        user_id = str(current_user.id)
        result = await file_storage_service.list_user_files(
            user_id=user_id,
            chat_id=chat_id,
            page=page,
            page_size=page_size
        )
        return result
    except Exception as e:
        logger.error(f"Error listing user files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}"
        )

@router.put("/metadata/{file_id}", response_model=FileMetadataResponse)
async def update_file_metadata(
    file_id: str,
    update_data: FileMetadataUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update file metadata. Only the file owner can update metadata.
    """
    try:
        user_id = str(current_user.id)
        updated_file = await file_storage_service.update_file_metadata(
            file_id, user_id, update_data
        )
        
        if not updated_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        return updated_file
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating file metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update file metadata: {str(e)}"
        )

@router.delete("/delete/{file_id}")
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a file from both S3 storage and database.
    Only the file owner can delete the file.
    """
    try:
        user_id = str(current_user.id)
        success = await file_storage_service.delete_file(file_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        return {"message": "File deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )

# Legacy endpoints for backward compatibility
@router.get("/get-upload-url")
async def get_upload_url_legacy(
    filename: str = Query(...),
    filetype: str = Query(...),
    chat_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Legacy endpoint for backward compatibility.
    Creates upload URL and stores metadata.
    """
    try:
        request = FileUploadRequest(
            filename=filename,
            file_type=filetype,
            chat_id=chat_id,
            file_size=0  # Size unknown in legacy endpoint
        )
        
        user_id = str(current_user.id)
        result = await file_storage_service.create_upload_url(request, user_id)
        
        # Return in legacy format
        return {"uploadURL": result.upload_url}
    except Exception as e:
        logger.error(f"Error in legacy upload URL endpoint: {e}")
        return {"error": str(e)}

@router.get("/test/list-all")
async def test_list_all_files():
    """
    Test endpoint to list all files in S3 without authentication.
    WARNING: This is for testing purposes only and should not be used in production.
    """
    try:
        # Get all files without user filtering
        result = await file_storage_service.test_list_all_files()
        return result
    except Exception as e:
        logger.error(f"Error listing all files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}"
        )

@router.get("/test/s3-connection")
async def test_s3_connection():
    """
    Test S3 connection and basic operations.
    WARNING: This is for testing purposes only.
    """
    try:
        result = await file_storage_service.test_s3_connection()
        return result
    except Exception as e:
        logger.error(f"Error testing S3 connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"S3 connection test failed: {str(e)}"
        )

@router.get("/test/s3-objects")
async def test_list_s3_objects():
    """
    Test endpoint to list all objects in S3 bucket.
    WARNING: This is for testing purposes only.
    """
    try:
        result = await file_storage_service.list_s3_objects()
        return result
    except Exception as e:
        logger.error(f"Error listing S3 objects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list S3 objects: {str(e)}"
        )

@router.post("/test/upload-url")
async def test_upload_url():
    """Test presigned URL generation"""
    try:
        logger.info("Testing presigned URL generation...")
        
        # Generate test presigned URL
        import uuid
        from .s3_client import s3_client, S3_BUCKET
        
        test_key = f"test/test-file-{uuid.uuid4()}.txt"
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': test_key
            },
            ExpiresIn=300
        )
        
        logger.info(f"Generated presigned URL: {presigned_url[:100]}...")
        
        return {
            "status": "success",
            "presigned_url": presigned_url,
            "test_key": test_key,
            "bucket": S3_BUCKET
        }
    except Exception as e:
        logger.error(f"Presigned URL generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Presigned URL generation failed: {str(e)}")

@router.post("/test/proxy-upload")
async def test_proxy_upload(
    file: UploadFile = File(...),
    chat_id: Optional[str] = Form(None)
):
    """Test proxy upload without authentication"""
    try:
        logger.info(f"Test proxy upload started for file: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        logger.info(f"Read {len(file_content)} bytes from file")
        
        # Create file upload request
        upload_request = FileUploadRequest(
            filename=file.filename,
            file_type=file.content_type or 'application/octet-stream',
            file_size=len(file_content),
            chat_id=chat_id,
            description="Test upload",
            tags=["test"]
        )
        
        # Create upload URL and metadata with test user
        test_user_id = "test-user-123"
        upload_response = await file_storage_service.create_upload_url(upload_request, test_user_id)
        logger.info(f"Created upload URL for file: {upload_response.file_id}")
        
        # Upload file directly to S3 from backend using put_object
        from .s3_client import s3_client, S3_BUCKET
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=upload_response.file_key,
            Body=file_content,
            ContentType=upload_request.file_type
        )
        logger.info(f"File uploaded to S3 successfully: {upload_response.file_key}")
        
        # Get file metadata with download URL
        file_metadata = await file_storage_service.get_file_metadata(upload_response.file_id, test_user_id)
        logger.info(f"File metadata retrieved: {file_metadata.filename}")
        
        return file_metadata
        
    except Exception as e:
        logger.error(f"Test proxy upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/test/content/{file_id}")
async def test_get_file_content(file_id: str):
    """
    Test endpoint to get file content by file ID without authentication.
    WARNING: This is for testing purposes only and should not be used in production.
    """
    try:
        # Get file metadata without user filtering
        file_metadata = await file_storage_service.get_file_metadata_by_id(file_id)
        
        if not file_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Get file content from S3
        content = await file_storage_service.get_file_content(file_metadata.file_key)
        
        return {
            "content": content,
            "filename": file_metadata.filename,
            "content_type": file_metadata.file_type,
            "file_id": file_id,
            "chat_id": file_metadata.chat_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file content: {str(e)}"
        )

@router.post("/proxy-upload")
async def proxy_upload(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    chat_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)
):
    """Upload file through backend proxy to avoid CORS issues"""
    try:
        logger.info(f"Proxy upload started for file: {file.filename}")
        
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
        
        # Create file upload request
        upload_request = FileUploadRequest(
            filename=file.filename,
            file_type=file.content_type or 'application/octet-stream',
            file_size=len(file_content),
            chat_id=chat_id,
            description=description,
            tags=parsed_tags
        )
        
        # Create upload URL and metadata
        user_id = str(current_user.id)
        upload_response = await file_storage_service.create_upload_url(upload_request, user_id)
        logger.info(f"Created upload URL for file: {upload_response.file_id}")
        
        # Upload file directly to S3 from backend using put_object
        from .s3_client import s3_client, S3_BUCKET
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=upload_response.file_key,
            Body=file_content,
            ContentType=upload_request.file_type
        )
        logger.info(f"File uploaded to S3 successfully: {upload_response.file_key}")
        
        # Get file metadata with download URL
        file_metadata = await file_storage_service.get_file_metadata(upload_response.file_id, user_id)
        logger.info(f"File metadata retrieved: {file_metadata.filename}")
        
        return file_metadata
        
    except Exception as e:
        logger.error(f"Proxy upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/get-download-url")
async def get_download_url_legacy(
    filekey: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Legacy endpoint for backward compatibility.
    Gets download URL by file key.
    """
    try:
        from .s3_client import s3_client, S3_BUCKET
        
        # Check if user has access to this file
        user_id = str(current_user.id)
        collection = file_storage_service.get_files_collection()
        file_doc = await collection.find_one({
            "file_key": filekey,
            "user_id": user_id
        })
        
        if not file_doc:
            return {"error": "File not found or access denied"}
        
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': filekey
            },
            ExpiresIn=3600
        )
        return {"downloadURL": presigned_url}
    except Exception as e:
        logger.error(f"Error in legacy download URL endpoint: {e}")
        return {"error": str(e)}

@router.get("/content/{file_id}")
async def get_file_content(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get file content by file ID.
    Downloads content from S3 and returns it as text.
    Only the file owner can access the content.
    """
    try:
        user_id = str(current_user.id)
        file_metadata = await file_storage_service.get_file_metadata(file_id, user_id)
        
        if not file_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )
        
        # Get file content from S3
        content = await file_storage_service.get_file_content(file_metadata.file_key)
        
        return {
            "content": content,
            "filename": file_metadata.filename,
            "content_type": file_metadata.file_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file content: {str(e)}"
        )

@router.get("/list-files")
async def list_files_legacy(
    prefix: str = Query("", description="Optional folder prefix"),
    current_user: dict = Depends(get_current_user)
):
    """
    Legacy endpoint for backward compatibility.
    Lists files with optional prefix filtering.
    """
    try:
        user_id = str(current_user.id)
        
        # If prefix is provided, filter by it
        collection = file_storage_service.get_files_collection()
        query = {"user_id": user_id}
        
        if prefix:
            query["file_key"] = {"$regex": f"^{prefix}"}
        
        cursor = collection.find(query).sort("created_at", -1)
        files_docs = await cursor.to_list(length=None)
        
        files = []
        for doc in files_docs:
            files.append({
                "key": doc["file_key"],
                "size": doc.get("file_size", 0),
                "last_modified": doc["created_at"]
            })
        
        return {"files": files}
    except Exception as e:
        logger.error(f"Error in legacy list files endpoint: {e}")
        return {"error": str(e)}