# Backend Integration Guide

## Overview

This document explains the new backend integration that processes uploaded files using pandas and sends the processed data as text to the AI API instead of file attachments.

## Architecture Flow

```
User uploads file → Frontend → Backend (FastAPI + pandas) → Data processing → AI API (as text) → Response → Frontend
```

### Detailed Flow:

1. **File Upload**: User uploads a data file (CSV, Excel, JSON, TXT)
2. **Frontend Detection**: Frontend detects data files and routes them to the backend
3. **Backend Processing**: FastAPI backend processes the file using pandas
4. **Data Analysis**: Comprehensive data analysis (statistics, structure, samples)
5. **Text Conversion**: Processed data is converted to structured text
6. **AI API Call**: Backend sends enhanced prompt with data to AI API
7. **Response**: AI response is returned through the backend to frontend

## Backend Features

### Supported File Types
- **CSV files** (.csv): Full pandas analysis with statistics
- **Excel files** (.xlsx, .xls): Multi-sheet support
- **JSON files** (.json): Structure detection and DataFrame conversion
- **Text files** (.txt, .log): Content analysis

### Data Processing Capabilities
- Data shape analysis (rows, columns)
- Column data types
- Summary statistics for numeric data
- Null value analysis
- Sample data extraction
- Memory usage analysis
- Unique value counts

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python start.py
```

**Alternative startup methods:**

```bash
# Using batch file (Windows)
start_backend.bat

# Using PowerShell script (Windows)
.\start_backend.ps1

# Direct uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Integration

The frontend automatically detects data files and routes them to the backend. No additional setup required.

## Configuration

### Backend Configuration (`config.py`)

```python
# Server settings
HOST = "0.0.0.0"
PORT = 8000

# File processing
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_FILE_TYPES = [".csv", ".xlsx", ".xls", ".json", ".txt", ".log"]

# AI API settings
DEFAULT_AI_API_URL = "http://localhost:9002/chat"
AI_API_TIMEOUT = 60

# CORS settings
ALLOWED_ORIGINS = [
    "http://localhost:9002",
    "http://localhost:3000"
]
```

### Frontend Configuration (`backend-service.ts`)

```typescript
const config = {
  baseUrl: 'http://localhost:8000',
  timeout: 60000
};
```

## API Endpoints

### POST /process-file

Processes uploaded files and sends data to AI API.

**Request:**
- `file`: File to process (multipart/form-data)
- `prompt`: User prompt/question
- `ai_api_url`: AI API endpoint (optional)

**Response:**
```json
{
  "success": true,
  "data": {}, // AI API response
  "file_info": {
    "filename": "data.csv",
    "content_type": "text/csv",
    "size": 1024,
    "size_mb": 0.001
  },
  "processed_data": {
    "type": "csv",
    "shape": [100, 5],
    "columns": ["col1", "col2"],
    "sample_data": [...],
    "summary_stats": {...}
  }
}
```

### GET /health
Health check endpoint.

### GET /
API information.

## Usage Examples

### 1. CSV File Processing

```bash
curl -X POST "http://localhost:8000/process-file" \
  -F "file=@sales_data.csv" \
  -F "prompt=Analyze sales trends and show top products" \
  -F "ai_api_url=http://localhost:9002/chat"
```

### 2. Excel File Processing

```bash
curl -X POST "http://localhost:8000/process-file" \
  -F "file=@financial_report.xlsx" \
  -F "prompt=Create a summary of financial performance"
```

### 3. JSON Data Processing

```bash
curl -X POST "http://localhost:8000/process-file" \
  -F "file=@api_logs.json" \
  -F "prompt=Find error patterns and performance issues"
```

## Frontend Integration Details

### File Detection Logic

The frontend automatically detects data files using:

```typescript
const dataFiles = filesToProcess.filter(file => 
  !file.type.startsWith('image/') || 
  file.name.toLowerCase().includes('.csv') ||
  file.name.toLowerCase().includes('.xlsx') ||
  file.name.toLowerCase().includes('.xls') ||
  file.name.toLowerCase().includes('.json') ||
  file.name.toLowerCase().includes('.txt')
);
```

### Fallback Mechanism

If the backend is unavailable, the system falls back to the original file attachment method:

```typescript
try {
  const backendResult = await backendService.processFile({...});
  // Use backend result
} catch (error) {
  console.error('Backend processing error:', error);
  // Fallback to regular action
  result = await sendMessageAction(formData);
}
```

## Benefits

1. **No File Attachment Issues**: Data is sent as text, avoiding API limitations
2. **Rich Data Analysis**: Comprehensive pandas-powered analysis
3. **Better AI Context**: Structured data provides better AI understanding
4. **Optimized Performance**: Smart sampling for large files
5. **Flexible Configuration**: Easy to customize and extend
6. **Robust Error Handling**: Graceful fallbacks and detailed error messages

## Troubleshooting

### Backend Not Starting

1. Check Python installation: `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check port availability: `netstat -an | findstr :8000`

### File Processing Errors

1. Check file size (max 50MB by default)
2. Verify file type is supported
3. Check backend logs for detailed errors

### Frontend Integration Issues

1. Verify backend is running: `http://localhost:8000/health`
2. Check CORS configuration
3. Verify frontend backend service URL

### AI API Communication

1. Check AI API endpoint is accessible
2. Verify timeout settings
3. Check request format compatibility

## Development

### Adding New File Types

1. Update `ALLOWED_FILE_TYPES` in `config.py`
2. Add processing logic in `file_processor.py`
3. Update frontend detection logic

### Customizing Data Processing

Modify the `FileProcessor` class methods in `file_processor.py` to add custom analysis features.

### Extending API

Add new endpoints in `main.py` following FastAPI patterns.

## Security Considerations

- File size limits prevent DoS attacks
- File type validation prevents malicious uploads
- CORS configuration restricts access origins
- No file storage - all processing is in-memory
- Timeout protection for AI API calls

## Performance Optimization

- Smart data sampling for large files
- Memory-efficient file processing
- Configurable timeouts
- Async processing where possible
- Minimal data transfer between services