from motor.motor_asyncio import AsyncIOMotorCollection
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from ..auth.database import get_database
from .models import FolderCreate, FolderUpdate, FolderInDB, FolderResponse

class FolderService:
    def __init__(self):
        self.collection_name = "folders"
    
    def get_collection(self) -> AsyncIOMotorCollection:
        db = get_database()
        return db[self.collection_name]
    
    async def create_indexes(self):
        """Create database indexes for folders collection"""
        collection = self.get_collection()
        await collection.create_index("user_id")
        await collection.create_index("name")
        await collection.create_index("created_at")
    
    async def create_folder(self, folder_data: FolderCreate, user_id: str) -> FolderResponse:
        """Create a new folder"""
        collection = self.get_collection()
        
        now = datetime.utcnow()
        folder_dict = {
            **folder_data.model_dump(),
            "user_id": user_id,
            "created_at": now,
            "updated_at": now
        }
        
        result = await collection.insert_one(folder_dict)
        folder_dict["id"] = str(result.inserted_id)
        folder_dict["_id"] = result.inserted_id
        
        return FolderResponse(**folder_dict)
    
    async def get_folders_by_user(self, user_id: str) -> List[FolderResponse]:
        """Get all folders for a user"""
        collection = self.get_collection()
        
        cursor = collection.find({"user_id": user_id}).sort("created_at", -1)
        folders = []
        
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            folders.append(FolderResponse(**doc))
        
        return folders
    
    async def get_folder_by_id(self, folder_id: str, user_id: str) -> Optional[FolderResponse]:
        """Get a folder by ID and user ID"""
        collection = self.get_collection()
        
        try:
            doc = await collection.find_one({
                "_id": ObjectId(folder_id),
                "user_id": user_id
            })
            
            if doc:
                doc["id"] = str(doc["_id"])
                return FolderResponse(**doc)
            return None
        except Exception:
            return None
    
    async def update_folder(self, folder_id: str, folder_data: FolderUpdate, user_id: str) -> Optional[FolderResponse]:
        """Update a folder"""
        collection = self.get_collection()
        
        try:
            update_data = {
                **folder_data.model_dump(),
                "updated_at": datetime.utcnow()
            }
            
            result = await collection.find_one_and_update(
                {"_id": ObjectId(folder_id), "user_id": user_id},
                {"$set": update_data},
                return_document=True
            )
            
            if result:
                result["id"] = str(result["_id"])
                return FolderResponse(**result)
            return None
        except Exception:
            return None
    
    async def delete_folder(self, folder_id: str, user_id: str) -> bool:
        """Delete a folder"""
        collection = self.get_collection()
        
        try:
            result = await collection.delete_one({
                "_id": ObjectId(folder_id),
                "user_id": user_id
            })
            return result.deleted_count > 0
        except Exception:
            return False

# Create singleton instance
folder_service = FolderService()