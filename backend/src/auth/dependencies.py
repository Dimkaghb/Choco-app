from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from auth.auth_utils import verify_token, extract_email_from_token
from auth.user_service import user_service
from auth.models import UserResponse

# Security scheme
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserResponse:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract token
        token = credentials.credentials
        
        # Verify token and extract email
        email = extract_email_from_token(token)
        if email is None:
            raise credentials_exception
        
        # Get user from database
        user = await user_service.get_user_by_email(email)
        if user is None:
            raise credentials_exception
        
        # Update user activity
        await user_service.update_user_activity(email)
        
        return user
        
    except Exception:
        raise credentials_exception

async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[UserResponse]:
    """Get current user if token is provided (optional authentication)"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        email = extract_email_from_token(token)
        if email:
            user = await user_service.get_user_by_email(email)
            if user and user.is_active:
                await user_service.update_user_activity(email)
                return user
    except Exception:
        pass
    
    return None