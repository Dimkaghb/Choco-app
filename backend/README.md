# Choco Data Processing API

A FastAPI backend service that processes uploaded files using pandas and sends the processed data to an AI API as text content instead of file attachments.

## Features

- **File Processing**: Supports CSV, Excel (.xlsx, .xls), JSON, and text files
- **Data Analysis**: Uses pandas for comprehensive data analysis and statistics
- **AI Integration**: Sends processed data as text to your AI API endpoint
- **Optimized Performance**: Configurable file size limits and smart data sampling
- **CORS Support**: Ready for frontend integration

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python start.py
```

Or directly:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /process-file

Processes an uploaded file and sends the data to an AI API.

**Parameters:**
- `file`: The file to process (multipart/form-data)
- `prompt`: User prompt/question about the data (form field)
- `ai_api_url`: AI API endpoint URL (form field, optional)

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

## Supported File Types

- **CSV files** (.csv): Full pandas analysis with statistics
- **Excel files** (.xlsx, .xls): Multi-sheet support with comprehensive analysis
- **JSON files** (.json): Automatic structure detection and DataFrame conversion when possible
- **Text files** (.txt, .log): Line and word count analysis

## Configuration

Edit `config.py` to customize:

- **File size limits**: `MAX_FILE_SIZE` (default: 50MB)
- **Allowed file types**: `ALLOWED_FILE_TYPES`
- **CORS origins**: `ALLOWED_ORIGINS`
- **AI API settings**: `DEFAULT_AI_API_URL`, `AI_API_TIMEOUT`
- **Server settings**: `HOST`, `PORT`

## Data Processing Features

For each file type, the API provides:

### CSV/Excel Files
- Data shape (rows, columns)
- Column names and data types
- Sample data (first 10 rows)
- Summary statistics for numeric columns
- Null value counts
- Unique value counts
- Memory usage information
- Full data for small files (<1000 rows)

### JSON Files
- Structure detection (tabular, nested, primitive)
- Automatic DataFrame conversion for structured data
- Sample data extraction
- Full data preservation

### Text Files
- Line and word counts
- Character count
- Sample lines preview
- Full content for small files

## Integration with Frontend

The processed data is sent to your AI API as a structured text prompt containing:

1. **File Information**: Name, size, type
2. **Processed Data**: Complete analysis results
3. **User Prompt**: Original question/request

This approach avoids file attachment issues while providing rich context to the AI.

## Example Usage

```bash
curl -X POST "http://localhost:8000/process-file" \
  -F "file=@data.csv" \
  -F "prompt=Analyze this sales data and show trends" \
  -F "ai_api_url=http://localhost:9002/chat"
```

## Error Handling

The API provides detailed error messages for:
- Unsupported file types
- File size exceeded
- Processing errors
- AI API communication issues
- Timeout errors

## Development

The backend is structured with:
- `main.py`: FastAPI application and endpoints
- `config.py`: Configuration settings
- `file_processor.py`: File processing logic
- `start.py`: Development server startup
- `requirements.txt`: Python dependencies