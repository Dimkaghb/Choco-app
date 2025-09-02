# Backend Structure Rules

## Directory Organization

### Root Structure
```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── <feature>/              # Feature-based modules
│   └── utils/                  # Shared utilities
├── data/                       # Persistent data storage
├── requirements.txt            # Python dependencies
├── dockerfile                  # Container configuration
└── .env                        # Environment variables
```

### Feature Module Structure
Each feature follows a consistent pattern:
```
<feature>/
├── __init__.py
├── api.py                      # FastAPI router endpoints
├── models.py                   # Pydantic schemas & data models
├── service.py                  # Business logic layer
├── crud.py                     # Database operations
├── utils.py                    # Feature-specific utilities
└── dependencies.py             # FastAPI dependencies (optional)
```

## File Responsibilities

### api.py
- Contains FastAPI router with feature prefix
- Handles HTTP request/response logic
- Input validation and error handling
- Authentication/authorization checks
- Delegates business logic to service layer

**Structure:**
```python
from fastapi import APIRouter, Depends, HTTPException
from .models import RequestModel, ResponseModel
from .service import feature_service
from src.auth.dependencies import get_current_user

router = APIRouter(prefix="/feature-name", tags=["feature-name"])

@router.post("/endpoint")
async def endpoint_handler(...):
    # Implementation
```

### models.py
- Pydantic models for request/response schemas
- Database model definitions
- Data validation rules
- Type definitions

**Naming Conventions:**
- Request models: `{Action}Request`
- Response models: `{Action}Response` or `{Entity}Response`
- Database models: `{Entity}` (e.g., `User`, `Document`)

### service.py
- Business logic implementation
- Orchestrates CRUD operations
- External service integrations
- Data processing and transformation
- No direct HTTP handling

### crud.py
- Database access layer
- CRUD operations (Create, Read, Update, Delete)
- Database-specific logic
- Query optimization
- Database-agnostic when possible

### utils.py
- Pure utility functions
- Helper methods specific to the feature
- File operations
- Data formatting
- Validation helpers

## Naming Conventions

### Modules
- Use snake_case for module names
- Descriptive, feature-based naming
- Examples: `auth`, `data_report`, `data_cleaning`

### Functions and Variables
- snake_case for functions and variables
- Descriptive names indicating purpose
- Async functions prefixed with `async`

### Classes
- PascalCase for class names
- Clear, descriptive names
- Pydantic models follow specific patterns

## Import Organization

### Standard Order
1. Standard library imports
2. Third-party imports (FastAPI, Pydantic, etc.)
3. Local application imports
4. Relative imports from same feature

### Example
```python
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.auth.dependencies import get_current_user
from src.utils.file_utils import validate_file

from .models import FeatureModel
from .service import feature_service
```

## Error Handling

### API Layer
- Use HTTPException for API errors
- Provide meaningful error messages
- Include appropriate HTTP status codes
- Log errors for debugging

### Service Layer
- Raise custom exceptions
- Handle external service failures
- Validate business rules
- Return meaningful error information

## Authentication & Authorization

### Protected Endpoints
- Use `get_current_user` dependency
- Include user context in operations
- Validate user permissions

### Example
```python
@router.post("/protected-endpoint")
async def protected_operation(
    request: RequestModel,
    current_user: User = Depends(get_current_user)
):
    # Implementation with user context
```

## Database Integration

### Connection Management
- Database connections handled in main.py lifespan
- Use dependency injection for database access
- Implement proper connection pooling

### Data Models
- Use Pydantic models for data validation
- Implement proper field validation
- Include metadata fields (created_at, updated_at)

## File Organization Best Practices

### Feature Independence
- Each feature should be self-contained
- Minimize cross-feature dependencies
- Use shared utilities for common functionality

### Code Reusability
- Extract common patterns to utils/
- Create reusable components
- Avoid code duplication

### Scalability
- Design for horizontal scaling
- Implement proper caching strategies
- Use async/await for I/O operations

## Environment Configuration

### Environment Variables
- Store sensitive data in .env files
- Use environment-specific configurations
- Validate required environment variables

### Settings Management
- Use Pydantic Settings for configuration
- Implement configuration validation
- Support multiple environments

## Testing Structure

### Test Organization
- Mirror source structure in tests/
- Separate unit and integration tests
- Use descriptive test names

### Test Files
- `test_{module_name}.py` for unit tests
- `test_integration_{feature}.py` for integration tests
- Mock external dependencies

## Documentation

### Code Documentation
- Use docstrings for all public functions
- Include parameter and return type information
- Provide usage examples

### API Documentation
- FastAPI auto-generates OpenAPI docs
- Use descriptive endpoint descriptions
- Include request/response examples

## Performance Considerations

### Async Operations
- Use async/await for I/O operations
- Implement proper connection pooling
- Handle concurrent requests efficiently

### Resource Management
- Implement proper file cleanup
- Use streaming for large files
- Monitor memory usage

## Security Guidelines

### Input Validation
- Validate all user inputs
- Sanitize file uploads
- Implement rate limiting

### Data Protection
- Encrypt sensitive data
- Use secure communication protocols
- Implement proper access controls

This structure ensures maintainability, scalability, and consistency across the QuokkaAI backend codebase.