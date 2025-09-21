from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    fileIds: List[str] = Field(default_factory=list)
    type: Optional[str] = Field(default="documents")

class FolderCreate(FolderBase):
    pass

class FolderUpdate(FolderBase):
    pass

class FolderResponse(FolderBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FolderInDB(FolderBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime