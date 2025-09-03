"""Authentication module for Choco application"""

from .api import router as auth_router
from .database import connect_to_mongo, close_mongo_connection, get_database, get_users_collection
from .dependencies import get_current_user, get_current_active_user, get_optional_current_user
from .models import UserCreate, UserLogin, UserResponse, Token
from .user_service import user_service
from .auth_utils import verify_password, get_password_hash, create_access_token, verify_token

__all__ = [
    "auth_router",
    "connect_to_mongo",
    "close_mongo_connection",
    "get_database",
    "get_users_collection",
    "get_current_user",
    "get_current_active_user",
    "get_optional_current_user",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "user_service",
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "verify_token",
]