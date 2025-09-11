from fastapi import APIRouter, HTTPException, status, Depends
from .models import AgentRequest, AgentResponse
from .service import ai_service
from ..auth.dependencies import get_current_user
from ..auth.models import UserResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["AI Agent"])

@router.post("/run", response_model=AgentResponse)
async def run_agent(
    request: AgentRequest,
    current_user: UserResponse = Depends(get_current_user)
) -> AgentResponse:
    """Run AI agent with the provided input"""
    try:
        logger.info(f"Processing AI agent request for user {current_user.id}")
        
        # Send request to AI service
        response = await ai_service.send_agent_request(request)
        
        # Log the response status
        if response.success:
            logger.info(f"AI agent request successful for user {current_user.id}")
        else:
            logger.warning(f"AI agent request failed for user {current_user.id}: {response.failure}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing AI agent request: {e}")
        return AgentResponse(
            success=False,
            error=f"Internal server error: {str(e)}"
        )

@router.get("/health")
async def agent_health() -> dict:
    """AI agent service health check"""
    return {"status": "healthy", "service": "ai-agent"}