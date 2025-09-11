import httpx
import asyncio
import logging
from typing import Dict, Any
from ..config import settings
from .models import AgentRequest, AgentResponse, AgentOutput, AgentFailure

logger = logging.getLogger(__name__)

class AIService:
    """Service for handling AI agent requests"""
    
    def __init__(self):
        self.ai_api_url = settings.AI_API_URL
        self.timeout = settings.AI_API_TIMEOUT
    
    async def send_agent_request(self, request: AgentRequest) -> AgentResponse:
        """Send request to AI agent and return response"""
        try:
            # Prepare request data
            request_data = request.dict()
            
            # Create HTTP client with timeout
            timeout = httpx.Timeout(self.timeout)
            
            async with httpx.AsyncClient(timeout=timeout) as client:
                logger.info(f"Sending request to AI API: {self.ai_api_url}")
                
                response = await client.post(
                    self.ai_api_url,
                    json=request_data,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
                
                # Check if request was successful
                if response.status_code == 200:
                    response_data = response.json()
                    
                    # Parse response based on expected structure
                    if "output" in response_data:
                        return AgentResponse(
                            success=True,
                            output=AgentOutput(**response_data["output"])
                        )
                    else:
                        # Handle direct content response
                        return AgentResponse(
                            success=True,
                            output=AgentOutput(
                                content=response_data.get("content", str(response_data)),
                                session_id=response_data.get("session_id")
                            )
                        )
                else:
                    # Handle HTTP errors
                    error_msg = f"HTTP {response.status_code}: {response.text}"
                    logger.error(f"AI API error: {error_msg}")
                    
                    return AgentResponse(
                        success=False,
                        failure=AgentFailure(
                            server=error_msg
                        )
                    )
                    
        except httpx.TimeoutException:
            error_msg = f"Request timeout after {self.timeout} seconds"
            logger.error(f"AI API timeout: {error_msg}")
            return AgentResponse(
                success=False,
                failure=AgentFailure(
                    server=error_msg
                )
            )
            
        except httpx.RequestError as e:
            error_msg = f"Request failed: {str(e)}"
            logger.error(f"AI API request error: {error_msg}")
            return AgentResponse(
                success=False,
                failure=AgentFailure(
                    server=error_msg
                )
            )
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"AI API unexpected error: {error_msg}")
            return AgentResponse(
                success=False,
                failure=AgentFailure(
                    server=error_msg
                )
            )

# Create service instance
ai_service = AIService()