from pydantic import BaseModel, Field, field_serializer
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class MessageCreate(BaseModel):
    """Message creation model"""
    role: str = Field(..., description="Message role: 'user' or 'ai'")
    content: str = Field(..., description="Message content")
    attachments: Optional[List[Dict[str, Any]]] = None
    visualization: Optional[Dict[str, Any]] = None
    plotly_chart: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    """Message response model"""
    id: str = Field(alias="_id", serialization_alias="id")
    role: str
    content: str
    attachments: Optional[List[Dict[str, Any]]] = None
    visualization: Optional[Dict[str, Any]] = None
    plotly_chart: Optional[Dict[str, Any]] = None
    timestamp: datetime
    
    class Config:
        populate_by_name = True
        validate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatCreate(BaseModel):
    """Chat creation model"""
    title: Optional[str] = Field(default="New Chat", description="Chat title")
    
class ChatUpdate(BaseModel):
    """Chat update model"""
    title: Optional[str] = None
    last_message_preview: Optional[str] = None

class ChatResponse(BaseModel):
    """Chat response model"""
    id: str = Field(alias="_id", serialization_alias="id")
    user_id: str
    title: str
    last_message_preview: Optional[str] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        validate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatWithMessages(ChatResponse):
    """Chat with messages model"""
    messages: List[MessageResponse] = []

class MessageInDB(BaseModel):
    """Message model as stored in database"""
    chat_id: str
    role: str
    content: str
    attachments: Optional[List[Dict[str, Any]]] = None
    visualization: Optional[Dict[str, Any]] = None
    plotly_chart: Optional[Dict[str, Any]] = None
    timestamp: datetime
    created_at: datetime
    updated_at: datetime

class ChatInDB(BaseModel):
    """Chat model as stored in database"""
    user_id: str
    title: str
    last_message_preview: Optional[str] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime