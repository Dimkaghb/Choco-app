from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import json
from config import settings
from file_processor import FileProcessor

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ProcessFileResponse(BaseModel):
    success: bool
    data: Optional[Dict[Any, Any]] = None
    error: Optional[str] = None
    file_info: Optional[Dict[str, Any]] = None
    processed_data: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    return {"message": "Choco Data Processing API is running"}

@app.post("/process-file", response_model=ProcessFileResponse)
async def process_file(
    file: UploadFile = File(...),
    prompt: str = Form(""),
    ai_api_url: str = Form(settings.DEFAULT_AI_API_URL)
):
    """
    Process uploaded file, extract data using pandas, and send to AI API
    """
    try:
        # Validate file size
        file_content = await file.read()
        if len(file_content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        file_info = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(file_content),
            "size_mb": round(len(file_content) / (1024*1024), 2)
        }
        
        # Process file using FileProcessor (optimized for speed)
        processed_data = FileProcessor.process_file(file_content, file.filename, file.content_type)
        
        # Create enhanced prompt with file data (limit data size for faster processing)
        enhanced_prompt = create_enhanced_prompt(prompt, processed_data, file_info)
        
        # Clear file content from memory to optimize
        del file_content
        
        # Send to AI API with timeout handling
        ai_response = await send_to_ai_api(enhanced_prompt, ai_api_url)
        
        return ProcessFileResponse(
            success=True,
            data=ai_response,
            file_info=file_info,
            processed_data=processed_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return ProcessFileResponse(
            success=False,
            error=str(e)
        )



def create_enhanced_prompt(original_prompt: str, processed_data: Dict[str, Any], file_info: Dict[str, Any]) -> str:
    """
    Create an enhanced prompt that includes file data as text (optimized for size)
    """
    # Create a lightweight version of processed_data for faster AI processing
    lightweight_data = {
        "type": processed_data.get('type', 'unknown'),
        "shape": processed_data.get('shape'),
        "columns": processed_data.get('columns'),
        "data_types": processed_data.get('data_types'),
        "sample_data": processed_data.get('sample_data', [])[:5],  # Limit to 5 rows
        "summary_stats": processed_data.get('summary_stats'),
        "null_counts": processed_data.get('null_counts')
    }
    
    data_summary = f"""
File Information:
- Filename: {file_info['filename']}
- Size: {file_info['size']} bytes ({file_info['size_mb']} MB)
- Type: {processed_data.get('type', 'unknown')}

Data Analysis (Sample):
{json.dumps(lightweight_data, indent=2, default=str)}

User Prompt:
{original_prompt}

Please analyze the provided data and respond to the user's request. The data has been processed and structured for your analysis.
"""
    
    return data_summary

async def send_to_ai_api(prompt: str, ai_api_url: str) -> Dict[str, Any]:
    """
    Send the enhanced prompt to the AI API using JSON format (optimized with better error handling)
    """
    try:
        # Use longer timeout for AI API calls
        timeout = httpx.Timeout(connect=30.0, read=settings.AI_API_TIMEOUT, write=30.0, pool=30.0)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            # Prepare the request data in JSON format to match frontend API calls
            json_data = {
                "message": prompt[:10000],  # Limit prompt size to prevent timeouts
                "execution_mode": "sync",
                "with_tts": False
            }
            
            response = await client.post(
                ai_api_url, 
                json=json_data,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            # Try to parse as JSON, fallback to text
            try:
                return response.json()
            except:
                return {"response": response.text}
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"AI API request timed out after {settings.AI_API_TIMEOUT} seconds")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Error connecting to AI API: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"AI API returned error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with AI API: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)