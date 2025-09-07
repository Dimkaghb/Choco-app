from typing import Optional
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from auth.database import get_users_collection
from auth.models import UserCreate, UserInDB, UserResponse
from auth.auth_utils import get_password_hash, verify_password
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self._collection = None
    
    @property
    def collection(self):
        if self._collection is None:
            self._collection = get_users_collection()
        return self._collection
    
    async def create_user(self, user_data: UserCreate) -> Optional[UserResponse]:
        """Create a new user"""
        try:
            # Check if user already exists
            existing_user = await self.collection.find_one({"email": user_data.email})
            if existing_user:
                return None
            
            # Create user document
            now = datetime.utcnow()
            user_doc = {
                "email": user_data.email,
                "hashed_password": get_password_hash(user_data.password),
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
            
            # Insert user
            result = await self.collection.insert_one(user_doc)
            
            # Return created user
            created_user = await self.collection.find_one({"_id": result.inserted_id})
            created_user["_id"] = str(created_user["_id"])
            return UserResponse(**created_user)
            
        except DuplicateKeyError:
            logger.warning(f"Attempt to create duplicate user: {user_data.email}")
            return None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise e
    
    async def authenticate_user(self, email: str, password: str) -> Optional[UserResponse]:
        """Authenticate user with email and password"""
        try:
            user = await self.collection.find_one({"email": email})
            if not user:
                return None
            
            if not verify_password(password, user["hashed_password"]):
                return None
            
            user["_id"] = str(user["_id"])
            return UserResponse(**user)
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email"""
        try:
            user = await self.collection.find_one({"email": email})
            if user:
                user["_id"] = str(user["_id"])
                return UserResponse(**user)
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        try:
            user = await self.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
                return UserResponse(**user)
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def update_user_activity(self, email: str) -> bool:
        """Update user's last activity timestamp"""
        try:
            result = await self.collection.update_one(
                {"email": email},
                {"$set": {"updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating user activity: {e}")
            return False

# Create service instance
user_service = UserService()