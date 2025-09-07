from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from chat.models import (
    ChatCreate,
    ChatUpdate,
    ChatResponse,
    ChatWithMessages,
    MessageCreate,
    MessageResponse
)
from chat.service import chat_service
from auth.dependencies import get_current_user
from auth.models import UserResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
async def create_chat(
    chat_data: ChatCreate,
    current_user: UserResponse = Depends(get_current_user)
) -> ChatResponse:
    """Create a new chat"""
    try:
        return await chat_service.create_chat(current_user.id, chat_data)
    except Exception as e:
        logger.error(f"Error creating chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat"
        )

@router.get("/", response_model=List[ChatResponse])
async def get_user_chats(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user)
) -> List[ChatResponse]:
    """Get all chats for the current user"""
    try:
        return await chat_service.get_user_chats(current_user.id, limit, skip)
    except Exception as e:
        logger.error(f"Error getting user chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chats"
        )

@router.get("/{chat_id}", response_model=ChatWithMessages)
async def get_chat(
    chat_id: str,
    current_user: UserResponse = Depends(get_current_user)
) -> ChatWithMessages:
    """Get a specific chat with all messages"""
    try:
        chat = await chat_service.get_chat_with_messages(chat_id, current_user.id)
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        return chat
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat"
        )

@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: str,
    update_data: ChatUpdate,
    current_user: UserResponse = Depends(get_current_user)
) -> ChatResponse:
    """Update a chat"""
    try:
        chat = await chat_service.update_chat(chat_id, current_user.id, update_data)
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        return chat
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update chat"
        )

@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a chat and all its messages"""
    try:
        success = await chat_service.delete_chat(chat_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        return {"message": "Chat deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat"
        )

@router.post("/{chat_id}/messages", response_model=MessageResponse)
async def add_message(
    chat_id: str,
    message_data: MessageCreate,
    current_user: UserResponse = Depends(get_current_user)
) -> MessageResponse:
    """Add a message to a chat"""
    try:
        return await chat_service.add_message(chat_id, current_user.id, message_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error adding message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add message"
        )

@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
async def get_chat_messages(
    chat_id: str,
    limit: int = Query(100, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user)
) -> List[MessageResponse]:
    """Get messages for a chat"""
    try:
        return await chat_service.get_chat_messages(chat_id, current_user.id, limit, skip)
    except Exception as e:
        logger.error(f"Error getting chat messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get messages"
        )

@router.get("/health")
async def chat_health() -> dict:
    """Chat service health check"""
    return {"status": "healthy", "service": "chat"}