"""Chat module for Choco application"""

from .api import router as chat_router
from .database import get_chats_collection, get_messages_collection, create_indexes
from .models import (
    ChatCreate, ChatUpdate, ChatResponse, ChatWithMessages,
    MessageCreate, MessageResponse, ChatInDB, MessageInDB
)
from .service import chat_service

__all__ = [
    "chat_router",
    "get_chats_collection",
    "get_messages_collection",
    "create_indexes",
    "ChatCreate",
    "ChatUpdate",
    "ChatResponse",
    "ChatWithMessages",
    "MessageCreate",
    "MessageResponse",
    "ChatInDB",
    "MessageInDB",
    "chat_service",
]