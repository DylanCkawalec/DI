#!/usr/bin/env python3
"""
ERC-8004 A2A API Server

This FastAPI server provides the public API endpoints for the Agent-to-Agent protocol.
It integrates with the oracle service and AI agents to provide trustless code review.
"""

import os
import sys
import asyncio
import json
import traceback
import time
from pathlib import Path
from typing import Dict, Any, Optional

# Load environment first
from dotenv import load_dotenv
load_dotenv()

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Web3 imports with error handling
try:
    from web3 import Web3
    from eth_account import Account
    print(f"✅ Web3 and eth_account successfully imported")
except ImportError as e:
    print(f"❌ Critical import failed: {e}")
    print("Please run: pip install web3 eth-account")
    sys.exit(1)

# Local imports with error handling
try:
    from agents.a2a_oracle_service import A2AOracleService
    from agents.code_review_server_agent import CodeReviewServerAgent, CodeReviewRequest
    print(f"✅ Local agent modules successfully imported")
except ImportError as e:
    print(f"⚠️ Warning: Agent imports failed: {e}")
    print("Will use fallback implementations")

# Pydantic models
class A2ASessionRequest(BaseModel):
    user_address: str
    prompt: str
    code: str
    language: str = "python"
    user_public_key: str

class SessionStatusResponse(BaseModel):
    session_id: str
    status: str
    created_at: str
    updated_at: str
    cost_eth: float
    transaction_count: int
    has_encrypted_payload: bool
    agent_address: str
    user_address: str

class DecryptPayloadRequest(BaseModel):
    session_id: str
    user_address: str
    user_signature: str

# Global services
oracle_service: Optional[A2AOracleService] = None
code_review_agent: Optional[CodeReviewServerAgent] = None

def initialize_services():
    """Initialize A2A services with proper error handling"""
    global oracle_service, code_review_agent
    
    try:
        private_key = os.getenv('PRIVATE_KEY')
        if not private_key:
            raise ValueError("PRIVATE_KEY not set in environment")
        
        print("🔮 Initializing A2A Oracle Service...")
        oracle_service = A2AOracleService(private_key)
        
        print("🤖 Initializing Code Review Agent...")
        code_review_agent = CodeReviewServerAgent(
            private_key,
            "alice-base-sepolia.erc8004.dev"
        )
        
        # Register agents if needed
        if not code_review_agent.agent_id:
            print("📝 Registering code review agent...")
            code_review_agent.register_agent()
        
        print("✅ All A2A services initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Service initialization failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

# FastAPI app
app = FastAPI(
    title="ERC-8004 A2A API Server",
    description="Agent-to-Agent protocol API for trustless AI interactions",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    success = initialize_services()
    if not success:
        print("🛑 Critical error: Failed to initialize services")

@app.get("/api/health")
async def health_check():
    """Health check endpoint with service status"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "oracle": oracle_service is not None,
            "code_review": code_review_agent is not None,
        },
        "blockchain": {
            "connected": oracle_service.w3.is_connected() if oracle_service else False,
            "chain_id": oracle_service.w3.eth.chain_id if oracle_service else None
        } if oracle_service else {"connected": False}
    }

@app.post("/api/a2a/create-session")
async def create_a2a_session(request: A2ASessionRequest):
    """Create new A2A session for code review"""
    try:
        if not oracle_service:
            raise HTTPException(status_code=503, detail="Oracle service not available")
        
        print(f"🔥 Creating A2A session for {request.user_address}")
        
        # Create session
        session_id = oracle_service.create_a2a_session(
            user_address=request.user_address,
            prompt=request.prompt,
            user_public_key=request.user_public_key
        )
        
        # Process code review asynchronously
        background_task = asyncio.create_task(
            process_code_review_async(session_id, request)
        )
        
        print(f"✅ A2A session created: {session_id}")
        
        return {
            "session_id": session_id,
            "status": "created",
            "message": "Session created, processing code review..."
        }
        
    except Exception as e:
        print(f"❌ Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_code_review_async(session_id: str, request: A2ASessionRequest):
    """Process code review asynchronously via AI agent"""
    try:
        print(f"🧠 Processing AI code review for session {session_id}")
        
        if not code_review_agent:
            raise Exception("Code review agent not available")
        
        # Create review request
        review_request = CodeReviewRequest(
            code=request.code,
            language=request.language,
            filename=f"user_code.{request.language}",
            description=request.prompt,
            focus_areas=["security", "performance", "maintainability", "style"]
        )
        
        # Perform AI analysis
        review_result = await code_review_agent._perform_code_review(review_request)
        
        # Convert to dict for oracle processing
        review_dict = review_result.model_dump()
        
        # Process through A2A oracle
        encrypted_payload = await oracle_service.process_a2a_request(
            session_id=session_id,
            code_analysis_result=review_dict,
            user_public_key=request.user_public_key
        )
        
        print(f"✅ AI code review completed for session {session_id}")
        
    except Exception as e:
        print(f"❌ Background code review failed for {session_id}: {e}")
        
        # Mark session as failed
        if oracle_service and session_id in oracle_service.sessions:
            oracle_service.sessions[session_id].status = "failed"

@app.get("/api/a2a/session-status")
async def get_session_status(id: str):
    """Get A2A session status"""
    try:
        if not oracle_service:
            raise HTTPException(status_code=503, detail="Oracle service not available")
        
        status = oracle_service.get_session_status(id)
        if not status:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting session status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/a2a/decrypt-payload")
async def decrypt_payload(request: DecryptPayloadRequest):
    """Decrypt A2A payload with user signature"""
    try:
        if not oracle_service:
            raise HTTPException(status_code=503, detail="Oracle service not available")
        
        print(f"🔐 Decrypting payload for session {request.session_id}")
        
        payload = await oracle_service.get_decrypted_payload(
            session_id=request.session_id,
            user_address=request.user_address,
            user_signature=request.user_signature
        )
        
        if not payload:
            raise HTTPException(status_code=403, detail="Invalid signature or session not found")
        
        print(f"✅ Payload decrypted for session {request.session_id}")
        
        return payload
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Payload decryption error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/a2a/sessions")
async def get_user_sessions(user: str):
    """Get all sessions for a user"""
    try:
        if not oracle_service:
            raise HTTPException(status_code=503, detail="Oracle service not available")
        
        sessions = oracle_service.get_user_sessions(user)
        return sessions
        
    except Exception as e:
        print(f"❌ Error getting user sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/blockchain/stats")
async def get_blockchain_stats():
    """Get blockchain statistics via DRPC"""
    try:
        if not oracle_service:
            raise HTTPException(status_code=503, detail="Oracle service not available")
        
        stats = oracle_service.get_blockchain_stats()
        return stats
        
    except Exception as e:
        print(f"❌ Error getting blockchain stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audit/transactions")
async def get_audit_log(limit: int = 50):
    """Get transaction audit log"""
    try:
        if not oracle_service:
            raise HTTPException(status_code=503, detail="Oracle service not available")
        
        log = oracle_service.get_transaction_audit_log(limit)
        return {"transactions": log, "count": len(log)}
        
    except Exception as e:
        print(f"❌ Error getting audit log: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/info")
async def get_agent_info():
    """Get combined agent information"""
    try:
        info = {
            "agents": {
                "code_review": {
                    "agent_id": code_review_agent.agent_id if code_review_agent else None,
                    "domain": code_review_agent.agent_domain if code_review_agent else "offline",
                    "address": code_review_agent.address if code_review_agent else None,
                    "status": "online" if code_review_agent else "offline"
                }
            },
            "oracle": {
                "active": oracle_service is not None,
                "sessions": len(oracle_service.sessions) if oracle_service else 0
            },
            "blockchain": {
                "connected": oracle_service.w3.is_connected() if oracle_service else False,
                "chain_id": oracle_service.w3.eth.chain_id if oracle_service else None,
                "network": "Base Sepolia" if oracle_service and oracle_service.w3.eth.chain_id == 84532 else "Unknown"
            } if oracle_service else {"connected": False}
        }
        
        return info
        
    except Exception as e:
        print(f"❌ Error getting agent info: {e}")
        return {
            "agents": {"code_review": {"status": "error"}},
            "oracle": {"active": False},
            "blockchain": {"connected": False},
            "error": str(e)
        }

# Development server runner
if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting ERC-8004 A2A API Server")
    print("=" * 50)
    
    # Initialize services
    success = initialize_services()
    if not success:
        print("🛑 Failed to initialize services - exiting")
        sys.exit(1)
    
    print("🌐 Starting server on http://localhost:8080")
    print("📚 API docs: http://localhost:8080/docs")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8080,
        log_level="info",
        access_log=True
    )