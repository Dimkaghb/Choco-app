from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class AgentAttachment(BaseModel):
    """Attachment model for AI agent requests"""
    type: str = Field(..., description="Attachment type")
    name: str = Field(..., description="Attachment name")
    data: str = Field(..., description="Base64 encoded data or content")
    mime_type: Optional[str] = Field(None, description="MIME type of attachment")

class AgentMessage(BaseModel):
    """Message model for AI agent requests"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class AgentInput(BaseModel):
    """Input model for AI agent requests"""
    messages: List[AgentMessage] = Field(..., description="List of messages")
    attachments: Optional[List[AgentAttachment]] = Field(None, description="List of attachments")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")

class AgentRequest(BaseModel):
    """Request model for AI agent endpoint"""
    input: AgentInput = Field(..., description="Agent input data")
    stream: bool = Field(False, description="Whether to stream the response")

class AgentFailure(BaseModel):
    """Failure model for AI agent responses"""
    server: Optional[str] = Field(None, description="Server error message")
    prompt: Optional[str] = Field(None, description="Prompt error message")

class AgentOutput(BaseModel):
    """Output model for AI agent responses"""
    content: str = Field(..., description="Response content")
    session_id: Optional[str] = Field(None, description="Session ID")

class AgentResponse(BaseModel):
    """Response model for AI agent endpoint"""
    success: bool = Field(..., description="Whether the request was successful")
    output: Optional[AgentOutput] = Field(None, description="Agent output data")
    failure: Optional[AgentFailure] = Field(None, description="Failure information")
    error: Optional[str] = Field(None, description="Error message")