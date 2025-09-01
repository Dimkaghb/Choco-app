# Backend Optimization Guide

## Problem
The application was experiencing timeout errors during file processing:
```
Backend processing error: Error: Request timeout - file processing took too long
```

## Root Causes
1. **Short timeouts**: Frontend and backend had 60-second timeouts
2. **Large data processing**: Full datasets were being processed and sent to AI API
3. **Memory inefficiency**: Large files were kept in memory during entire processing
4. **Inefficient AI API calls**: Large prompts were causing delays

## Optimizations Applied

### 1. Increased Timeouts

**Frontend (`src/lib/backend-service.ts`)**:
- Increased timeout from 60 seconds to 180 seconds (3 minutes)

**Backend (`backend/config.py`)**:
- Increased AI_API_TIMEOUT from 60 seconds to 180 seconds
- Added granular timeout configuration for different operations

### 2. Data Processing Optimization

**File Processor (`backend/file_processor.py`)**:
- Limited full data inclusion to files with ≤100 rows (previously 1000)
- Reduced sample data to first 5 rows for AI processing
- Optimized memory usage by processing data in chunks

### 3. Memory Management

**Main API (`backend/main.py`)**:
- Added explicit memory cleanup (`del file_content`)
- Created lightweight data structures for AI processing
- Limited prompt size to 10,000 characters to prevent AI API timeouts

### 4. Enhanced Error Handling

**AI API Communication**:
- Added detailed timeout configuration (connect, read, write, pool)
- Improved error messages with specific timeout information
- Added HTTP status error handling
- Better exception handling for different error types

### 5. Prompt Optimization

**Enhanced Prompt Creation**:
- Created lightweight data summaries instead of full datasets
- Limited sample data to 5 rows maximum
- Removed unnecessary data fields from AI prompts
- Added file size information for better context

## Performance Improvements

### Before Optimization
- Timeout: 60 seconds
- Full data processing for files up to 1000 rows
- Large prompts sent to AI API
- Basic error handling

### After Optimization
- Timeout: 180 seconds (3x increase)
- Lightweight processing with 100-row limit
- Optimized prompts with 10KB limit
- Comprehensive error handling
- Memory cleanup

## Configuration Changes

### Frontend Timeout
```typescript
// src/lib/backend-service.ts
timeout: 180000  // 3 minutes
```

### Backend Timeout
```python
# backend/config.py
AI_API_TIMEOUT: int = 180  # 3 minutes
```

### Data Limits
```python
# backend/file_processor.py
"full_data": df.head(100).to_dict('records') if df.shape[0] <= 100 else None
```

### Prompt Limits
```python
# backend/main.py
"message": prompt[:10000]  # Limit to 10KB
```

## Testing

To test the optimizations:

1. **Upload a large file** (>1MB CSV/Excel)
2. **Monitor processing time** - should complete within 3 minutes
3. **Check memory usage** - should be more efficient
4. **Verify AI responses** - should receive proper responses without timeouts

## Monitoring

Watch for these indicators of successful optimization:
- Reduced processing times
- Fewer timeout errors
- Lower memory usage
- Faster AI API responses
- Better error messages when issues occur

## Future Improvements

1. **Streaming processing** for very large files
2. **Background job processing** for heavy computations
3. **Caching** for frequently processed data
4. **Progressive data loading** in frontend
5. **File chunking** for extremely large datasets

## Troubleshooting

If timeouts still occur:

1. Check file size (limit: 50MB)
2. Verify AI API availability
3. Monitor network connectivity
4. Check backend logs for specific errors
5. Consider further timeout increases if needed

## Dependencies

Ensure these packages are installed:
- `httpx` with timeout support
- `pandas` for efficient data processing
- `fastapi` with async support