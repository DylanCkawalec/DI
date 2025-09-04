#!/usr/bin/env python3
"""
ERC-8004 A2A API Server

FastAPI server providing A2A protocol endpoints for the frontend.
Integrates with the oracle service for blockchain interactions.
"""

import os
import sys
import json
import asyncio
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

# FastAPI imports
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

# Local imports
from agents.a2a_oracle_service import get_oracle_service, A2ASession
from agents.code_review_server_agent import CodeReviewServerAgent, CodeReviewRequest
from dotenv import load_dotenv

load_dotenv()

# Pydantic models for API
class A2ASessionCreate(BaseModel):
    user_address: str
    prompt: str
    code: str
    language: str
    user_public_key: str

class DecryptPayloadRequest(BaseModel):
    session_id: str
    user_address: str
    user_signature: str

class A2ASessionResponse(BaseModel):
    session_id: str
    status: str
    created_at: str
    updated_at: str
    cost_eth: float
    transaction_count: int
    has_encrypted_payload: bool
    agent_address: str
    user_address: str

# Initialize FastAPI app
app = FastAPI(
    title="ERC-8004 A2A Code Review API",
    description="Agent-to-Agent protocol API for trustless code review",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Global state
ai_agent = None
oracle = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global ai_agent, oracle
    
    try:
        # Initialize AI agent
        agent_key = os.getenv('PRIVATE_KEY')
        if not agent_key:
            raise ValueError("PRIVATE_KEY not set")
        
        ai_agent = CodeReviewServerAgent(agent_key, "a2a-code-review.erc8004.dev")
        
        # Register agent if needed
        if not ai_agent.agent_id:
            ai_agent.register_agent()
        
        # Initialize oracle service
        oracle = get_oracle_service()
        
        # Start background blockchain polling
        asyncio.create_task(oracle.poll_blockchain_status())
        
        print("🚀 A2A API Server started successfully")
        print(f"   AI Agent ID: {ai_agent.agent_id}")
        print(f"   Oracle Service: Active")
        
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        raise

@app.post("/api/a2a/create-session", response_model=A2ASessionResponse)
async def create_a2a_session(request: A2ASessionCreate, background_tasks: BackgroundTasks):
    """Create new A2A protocol session for code review"""
    
    if not oracle or not ai_agent:
        raise HTTPException(status_code=503, detail="Services not ready")
    
    try:
        # Create A2A session
        session_id = oracle.create_a2a_session(
            user_address=request.user_address,
            prompt=request.prompt,
            user_public_key=request.user_public_key
        )
        
        # Start background processing
        background_tasks.add_task(
            process_code_review_async,
            session_id=session_id,
            prompt=request.prompt,
            code=request.code,
            language=request.language,
            user_public_key=request.user_public_key
        )
        
        # Return session status
        session_status = oracle.get_session_status(session_id)
        return A2ASessionResponse(**session_status)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")

async def process_code_review_async(session_id: str, prompt: str, code: str, 
                                  language: str, user_public_key: str):
    """Background task to process code review through A2A protocol"""
    
    try:
        # Create review request
        review_request = CodeReviewRequest(
            code=code,
            language=language,
            filename=f"user_code.{language}",
            description=prompt,
            focus_areas=["security", "performance", "maintainability", "style"]
        )
        
        # Process with AI agent
        review_result = await ai_agent._perform_code_review(review_request)
        
        # Convert to dict for JSON serialization (Pydantic v2)
        analysis_data = review_result.model_dump()
        
        # Process through A2A oracle
        encrypted_payload = await oracle.process_a2a_request(
            session_id=session_id,
            code_analysis_result=analysis_data,
            user_public_key=user_public_key
        )
        
        print(f"✅ A2A processing completed for session {session_id}")
        
    except Exception as e:
        print(f"❌ A2A processing failed for {session_id}: {e}")
        
        # Update session status to failed
        if oracle and session_id in oracle.sessions:
            oracle.sessions[session_id].status = "failed"
            oracle._save_session(oracle.sessions[session_id])

@app.get("/api/a2a/session-status")
async def get_session_status(id: str):
    """Get current status of an A2A session"""
    
    if not oracle:
        raise HTTPException(status_code=503, detail="Oracle service not ready")
    
    status = oracle.get_session_status(id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return status

@app.get("/api/sessions")
async def get_user_sessions(user: str):
    """Get all sessions for a user"""
    
    if not oracle:
        raise HTTPException(status_code=503, detail="Oracle service not ready")
    
    try:
        sessions = oracle.get_user_sessions(user)
        return sessions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

@app.post("/api/a2a/decrypt-payload")
async def decrypt_payload(request: DecryptPayloadRequest):
    """Decrypt encrypted payload for user with signature verification"""
    
    if not oracle:
        raise HTTPException(status_code=503, detail="Oracle service not ready")
    
    try:
        # Get decrypted payload
        result = await oracle.get_decrypted_payload(
            session_id=request.session_id,
            user_address=request.user_address,
            user_signature=request.user_signature
        )
        
        if not result:
            raise HTTPException(status_code=403, detail="Access denied or invalid signature")
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")

@app.get("/api/blockchain/stats")
async def get_blockchain_stats():
    """Get current blockchain statistics via DRPC"""
    
    if not oracle:
        raise HTTPException(status_code=503, detail="Oracle service not ready")
    
    return oracle.get_blockchain_stats()

@app.get("/api/audit/transactions")
async def get_audit_transactions(limit: int = 50):
    """Get transaction audit log"""
    
    if not oracle:
        raise HTTPException(status_code=503, detail="Oracle service not ready")
    
    return oracle.get_transaction_audit_log(limit)

@app.get("/api/agent/info")
async def get_agent_info():
    """Get AI agent information"""
    
    if not ai_agent:
        raise HTTPException(status_code=503, detail="AI agent not ready")
    
    return {
        "agent_id": ai_agent.agent_id,
        "agent_domain": ai_agent.agent_domain,
        "agent_address": ai_agent.address,
        "services": ["a2a_code_review", "encrypted_payloads", "session_management"],
        "ai_providers": [
            "grok" if ai_agent.grok_client else None,
            "claude" if ai_agent.anthropic_client else None, 
            "openai" if ai_agent.openai_client else None
        ],
        "status": "online",
        "erc8004_compliant": True
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "ai_agent": ai_agent is not None,
            "oracle_service": oracle is not None,
            "blockchain_connection": oracle.w3.is_connected() if oracle else False
        }
    }

# WebSocket support for real-time updates (optional enhancement)
@app.websocket("/ws/session/{session_id}")
async def websocket_session_updates(websocket, session_id: str):
    """WebSocket endpoint for real-time session updates"""
    await websocket.accept()
    
    try:
        while True:
            if oracle and session_id in oracle.sessions:
                session_status = oracle.get_session_status(session_id)
                await websocket.send_json(session_status)
            
            await asyncio.sleep(5)  # Send updates every 5 seconds
            
    except Exception as e:
        print(f"WebSocket error for session {session_id}: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting ERC-8004 A2A API Server...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8080,
        log_level="info"
    )
