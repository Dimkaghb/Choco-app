from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..auth.dependencies import get_current_user
from ..auth.models import UserResponse
from .models import FolderCreate, FolderUpdate, FolderResponse
from .service import folder_service

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