# Authentication System Implementation

## Overview

This document describes the comprehensive JWT-based authentication system implemented for the Choco application, featuring secure password hashing, MongoDB integration, and frontend-backend connectivity.

## Architecture

### Backend Components

#### 1. Database Layer (`auth/database.py`)
- **MongoDB Connection**: Async MongoDB client using Motor
- **Connection Management**: Automatic connection/disconnection in app lifecycle
- **Database Access**: Centralized database and collection getters

#### 2. Authentication Utilities (`auth/auth_utils.py`)
- **Password Hashing**: Bcrypt-based secure password hashing
- **JWT Tokens**: Token creation, verification, and email extraction
- **Security**: Configurable token expiration and secret keys

#### 3. Data Models (`auth/models.py`)
- **UserCreate**: Registration data validation
- **UserLogin**: Login credentials validation
- **UserResponse**: Safe user data without passwords
- **Token**: JWT token response with user data
- **UserInDB**: Database user model with hashed passwords

#### 4. User Service (`auth/user_service.py`)
- **User Management**: Create, authenticate, and retrieve users
- **Database Operations**: Async MongoDB operations
- **Security**: Password verification and user activity tracking

#### 5. Dependencies (`auth/dependencies.py`)
- **Authentication Middleware**: JWT token validation
- **User Injection**: Current user dependency injection
- **Optional Auth**: Support for optional authentication

#### 6. API Routes (`auth/api.py`)
- **POST /auth/register**: User registration
- **POST /auth/login**: User authentication
- **GET /auth/me**: Current user profile
- **POST /auth/verify-token**: Token validation
- **POST /auth/refresh**: Token refresh

### Frontend Components

#### 1. Auth Service (`lib/auth-service.ts`)
- **API Integration**: Centralized authentication API calls
- **Token Management**: Local storage token handling
- **User State**: User data persistence and retrieval

#### 2. Auth Component (`components/auth.tsx`)
- **UI Interface**: Registration and login forms
- **Form Validation**: Email and password validation
- **Error Handling**: User-friendly error messages

## Security Features

### Password Security
- **Bcrypt Hashing**: Industry-standard password hashing
- **Salt Rounds**: Automatic salt generation
- **Password Validation**: Minimum 8 characters requirement

### JWT Security
- **HS256 Algorithm**: Secure token signing
- **Configurable Expiration**: 30-minute default token lifetime
- **Secret Key**: Environment-based secret key configuration

### Database Security
- **No Plain Passwords**: Only hashed passwords stored
- **User Activity Tracking**: Last activity timestamps
- **Duplicate Prevention**: Email uniqueness enforcement

## Configuration

### Environment Variables
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database
SECRET_KEY=your-super-secret-jwt-key
```

### Settings (`config.py`)
```python
# Authentication Configuration
SECRET_KEY: str = "your-secret-key-change-this-in-production"
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

# MongoDB Configuration
MONGODB_URL: str = "mongodb://localhost:27017"
DATABASE_NAME: str = "Choco"
USERS_COLLECTION: str = "Choco_users"
```

## API Endpoints

### Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe" // optional
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Protected Routes
```http
GET /auth/me
Authorization: Bearer <jwt_token>
```

## Frontend Usage

### Authentication Service
```typescript
import { authService } from '@/lib/auth-service';

// Register user
const authData = await authService.register({
  email: 'user@example.com',
  password: 'password123'
});

// Login user
const authData = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Check authentication
const isAuth = authService.isAuthenticated();

// Get current user
const user = authService.getUser();

// Logout
authService.logout();
```

### Protected API Calls
```typescript
const token = authService.getToken();
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Database Schema

### Users Collection (Choco_users)
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "hashed_password": "$2b$12$...",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Error Handling

### Backend Errors
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Invalid credentials or token
- **500 Internal Server Error**: Server-side errors

### Frontend Errors
- **Network Errors**: Connection issues
- **Validation Errors**: Form validation failures
- **Authentication Errors**: Login/registration failures

## Best Practices Implemented

1. **Secure Password Storage**: Bcrypt hashing with automatic salting
2. **JWT Best Practices**: Short-lived tokens with refresh capability
3. **Environment Configuration**: Sensitive data in environment variables
4. **Error Handling**: Comprehensive error handling and logging
5. **Type Safety**: Full TypeScript implementation
6. **Async Operations**: Non-blocking database operations
7. **CORS Configuration**: Proper cross-origin request handling
8. **Input Validation**: Pydantic model validation
9. **Dependency Injection**: FastAPI dependency system
10. **Separation of Concerns**: Modular architecture

## Testing the Implementation

1. **Start Backend**: `python -m uvicorn src.main:app --reload`
2. **Test Registration**: Use the frontend auth modal or API directly
3. **Test Login**: Authenticate with registered credentials
4. **Test Protected Routes**: Access `/auth/me` with valid token
5. **Test Token Validation**: Use `/auth/verify-token` endpoint

## Production Considerations

1. **Change Secret Key**: Use a strong, unique secret key
2. **HTTPS Only**: Ensure all communication is encrypted
3. **Token Expiration**: Consider shorter token lifetimes
4. **Rate Limiting**: Implement login attempt rate limiting
5. **Monitoring**: Add authentication event logging
6. **Backup**: Regular database backups
7. **Security Headers**: Add security headers to responses