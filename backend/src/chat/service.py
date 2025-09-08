from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import uuid
from chat.database import get_chats_collection, get_messages_collection
from chat.models import (
    ChatCreate, ChatUpdate, ChatResponse, ChatWithMessages,
    MessageCreate, MessageResponse, ChatInDB, MessageInDB
)
import logging

logger = logging.getLogger(__name__)

class ChatService:
    """Service for managing chats and messages"""
    
    async def create_chat(self, user_id: str, chat_data: ChatCreate) -> ChatResponse:
        """Create a new chat for a user"""
        try:
            chats_collection = get_chats_collection()
            
            now = datetime.utcnow()
            # Generate a random session_id for AI requests
            session_id = str(uuid.uuid4())
            
            chat_doc = ChatInDB(
                user_id=user_id,
                title=chat_data.title or "New Chat",
                session_id=session_id,
                last_message_preview=None,
                message_count=0,
                created_at=now,
                updated_at=now
            ).dict()
            
            result = await chats_collection.insert_one(chat_doc)
            chat_doc["_id"] = str(result.inserted_id)
            
            return ChatResponse(**chat_doc)
            
        except Exception as e:
            logger.error(f"Error creating chat: {e}")
            raise e
    
    async def get_user_chats(self, user_id: str, limit: int = 50, skip: int = 0) -> List[ChatResponse]:
        """Get all chats for a user, ordered by last update"""
        try:
            chats_collection = get_chats_collection()
            
            cursor = chats_collection.find(
                {"user_id": user_id}
            ).sort("updated_at", -1).skip(skip).limit(limit)
            
            chats = []
            async for chat_doc in cursor:
                chat_doc["_id"] = str(chat_doc["_id"])
                # Add default session_id for existing records that don't have it
                if "session_id" not in chat_doc:
                    chat_doc["session_id"] = str(uuid.uuid4())
                chats.append(ChatResponse(**chat_doc))
            
            return chats
            
        except Exception as e:
            logger.error(f"Error getting user chats: {e}")
            raise e
    
    async def get_chat_with_messages(self, chat_id: str, user_id: str) -> Optional[ChatWithMessages]:
        """Get a chat with all its messages"""
        try:
            chats_collection = get_chats_collection()
            messages_collection = get_messages_collection()
            
            # Get chat
            chat_doc = await chats_collection.find_one({
                "_id": ObjectId(chat_id),
                "user_id": user_id
            })
            
            if not chat_doc:
                return None
            
            chat_doc["_id"] = str(chat_doc["_id"])
            # Add default session_id for existing records that don't have it
            if "session_id" not in chat_doc:
                chat_doc["session_id"] = str(uuid.uuid4())
            
            # Get messages
            cursor = messages_collection.find(
                {"chat_id": chat_id}
            ).sort("timestamp", 1)
            
            messages = []
            async for msg_doc in cursor:
                msg_doc["_id"] = str(msg_doc["_id"])
                messages.append(MessageResponse(**msg_doc))
            
            logger.info(f"Found {len(messages)} messages for chat {chat_id}")
            
            chat_with_messages = ChatWithMessages(**chat_doc)
            chat_with_messages.messages = messages
            
            return chat_with_messages
            
        except Exception as e:
            logger.error(f"Error getting chat with messages: {e}")
            raise e
    
    async def update_chat(self, chat_id: str, user_id: str, update_data: ChatUpdate) -> Optional[ChatResponse]:
        """Update a chat"""
        try:
            chats_collection = get_chats_collection()
            
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await chats_collection.find_one_and_update(
                {"_id": ObjectId(chat_id), "user_id": user_id},
                {"$set": update_dict},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                return ChatResponse(**result)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating chat: {e}")
            raise e
    
    async def delete_chat(self, chat_id: str, user_id: str) -> bool:
        """Delete a chat and all its messages"""
        try:
            chats_collection = get_chats_collection()
            messages_collection = get_messages_collection()
            
            # Delete all messages first
            await messages_collection.delete_many({"chat_id": chat_id})
            
            # Delete the chat
            result = await chats_collection.delete_one({
                "_id": ObjectId(chat_id),
                "user_id": user_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting chat: {e}")
            raise e
    
    async def add_message(self, chat_id: str, user_id: str, message_data: MessageCreate) -> MessageResponse:
        """Add a message to a chat"""
        try:
            chats_collection = get_chats_collection()
            messages_collection = get_messages_collection()
            
            # Verify chat belongs to user
            chat = await chats_collection.find_one({
                "_id": ObjectId(chat_id),
                "user_id": user_id
            })
            
            if not chat:
                raise ValueError("Chat not found or access denied")
            
            # Create message
            now = datetime.utcnow()
            message_doc = MessageInDB(
                chat_id=chat_id,
                role=message_data.role,
                content=message_data.content,
                attachments=message_data.attachments,
                visualization=message_data.visualization,
                plotly_chart=message_data.plotly_chart,
                timestamp=now,
                created_at=now,
                updated_at=now
            ).dict()
            
            result = await messages_collection.insert_one(message_doc)
            message_doc["_id"] = str(result.inserted_id)
            
            # Update chat with last message preview and increment message count
            preview = message_data.content[:100] + "..." if len(message_data.content) > 100 else message_data.content
            await chats_collection.update_one(
                {"_id": ObjectId(chat_id)},
                {
                    "$set": {
                        "last_message_preview": preview,
                        "updated_at": now
                    },
                    "$inc": {"message_count": 1}
                }
            )
            
            return MessageResponse(**message_doc)
            
        except Exception as e:
            logger.error(f"Error adding message: {e}")
            raise e
    
    async def get_chat_messages(self, chat_id: str, user_id: str, limit: int = 100, skip: int = 0) -> List[MessageResponse]:
        """Get messages for a chat"""
        try:
            chats_collection = get_chats_collection()
            messages_collection = get_messages_collection()
            
            # Verify chat belongs to user
            chat = await chats_collection.find_one({
                "_id": ObjectId(chat_id),
                "user_id": user_id
            })
            
            if not chat:
                return []
            
            cursor = messages_collection.find(
                {"chat_id": chat_id}
            ).sort("timestamp", 1).skip(skip).limit(limit)
            
            messages = []
            async for msg_doc in cursor:
                msg_doc["_id"] = str(msg_doc["_id"])
                messages.append(MessageResponse(**msg_doc))
            
            return messages
            
        except Exception as e:
            logger.error(f"Error getting chat messages: {e}")
            raise e

# Create service instance
chat_service = ChatService()