# Choco Data Processing API Backend

This is the backend service for the Choco application, built with FastAPI following a feature-based architecture.

## Architecture

The backend follows a structured, feature-based organization:

```
backend/
├── src/                        # Source code
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Application configuration
│   ├── file_processing/        # File processing feature
│   │   ├── api.py             # FastAPI router endpoints
│   │   ├── models.py          # Pydantic schemas
│   │   ├── service.py         # Business logic
│   │   └── utils.py           # Feature utilities
│   └── utils/                  # Shared utilities
│       └── report_generator.py # Report generation
├── data/                       # Persistent data storage
├── requirements.txt            # Python dependencies
├── dockerfile                  # Container configuration
├── .env.example               # Environment variables template
└── start.py                   # Application startup script
```

## Features

- File upload and processing (CSV, Excel, JSON, Text)
- Data analysis and summarization
- RESTful API endpoints with feature-based routing
- CORS support for frontend integration
- Report generation capabilities
- Environment-based configuration
- Docker support

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Run the server:
```bash
python start.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Core Endpoints
- `GET /` - Root endpoint
- `GET /health` - Health check

### File Processing
- `POST /file-processing/process-file` - Process uploaded files
- `GET /file-processing/supported-formats` - Get supported file formats
- `GET /file-processing/health` - File processing service health

## Supported File Types

- **CSV files** (.csv): Full pandas analysis with statistics
- **Excel files** (.xlsx, .xls): Multi-sheet support with comprehensive analysis
- **JSON files** (.json): Automatic structure detection and DataFrame conversion when possible
- **Text files** (.txt, .log): Line and word count analysis

## Configuration

Configuration is handled through environment variables and the `src/config.py` file:

- **Server Settings**: Host, port, CORS origins
- **File Processing**: Size limits, allowed file types
- **AI API**: Endpoint URL, timeout settings
- **Data Processing**: Sample sizes, preview limits

## Docker Support

Build and run with Docker:

```bash
# Build image
docker build -t choco-backend .

# Run container
docker run -p 8000:8000 choco-backend
```

## Development

The backend follows these principles:

- **Feature-based organization**: Each feature is self-contained
- **Separation of concerns**: API, business logic, and data access are separated
- **Type safety**: Pydantic models for request/response validation
- **Environment configuration**: Settings managed through environment variables
- **Error handling**: Comprehensive error handling with meaningful messages

## Adding New Features

To add a new feature:

1. Create a new directory under `src/`
2. Follow the feature structure: `api.py`, `models.py`, `service.py`, `utils.py`
3. Register the router in `src/main.py`
4. Update documentation

Refer to `BACKEND_STRUCTURE_RULES.md` for detailed guidelines.