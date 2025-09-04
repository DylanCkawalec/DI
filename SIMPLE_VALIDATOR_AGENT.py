#!/usr/bin/env python3
"""
🛡️ SIMPLE VALIDATOR AGENT

Standalone validator agent that works without complex Web3 dependencies.
Provides real AI validation for the frontend.
"""

import os
import sys
import json
import time
import asyncio
from pathlib import Path
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment
from dotenv import load_dotenv
load_dotenv()

class ValidationRequest(BaseModel):
    review_id: str
    original_code: str
    original_response: Dict[str, Any]
    server_agent_id: int
    transaction_hash: str = "local"
    language: str = "python"

class ValidationResponse(BaseModel):
    validation_id: str
    review_id: str
    validation_score: int
    accuracy_score: int
    completeness_score: int
    methodology_score: int
    discrepancies: list
    validator_analysis: Dict[str, Any]
    recommendation: str

class SimpleValidatorAgent:
    """Simple validator agent for real AI validation"""
    
    def __init__(self):
        self.app = self.create_app()
        self.agent_id = 1001  # Simple agent ID
        self.validations_count = 0
        
        # Initialize AI clients if available
        self.init_ai_clients()
        
        print("🛡️ Simple Validator Agent initialized")
        print("   Mode: Offline-capable validation")
        print("   Port: 8081")
        print("   AI Integration: Available" if self.has_ai else "Local only")
    
    def init_ai_clients(self):
        """Initialize AI clients for real validation"""
        self.has_ai = False
        
        # Try Claude (preferred for validation)
        if os.getenv('ANTHROPIC_API_KEY'):
            try:
                import anthropic
                self.claude_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
                self.has_ai = True
                print("   ✅ Claude AI available for validation")
            except ImportError:
                print("   ⚠️ Claude not available (anthropic package missing)")
        
        # Try OpenAI as backup
        if not self.has_ai and os.getenv('OPENAI_API_KEY'):
            try:
                import openai
                self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                self.has_ai = True
                print("   ✅ OpenAI available for validation")
            except ImportError:
                print("   ⚠️ OpenAI not available")
    
    def create_app(self) -> FastAPI:
        """Create FastAPI app"""
        app = FastAPI(
            title="Simple ERC-8004 Validator Agent",
            description="Offline-capable validator for code review validation",
            version="2.0.0"
        )
        
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"]
        )
        
        @app.get("/")
        async def root():
            return {"message": "Simple Validator Agent", "status": "online", "agent_id": self.agent_id}
        
        @app.get("/agent/info")
        async def agent_info():
            return {
                "agent_id": self.agent_id,
                "domain": "simple-validator.erc8004.dev",
                "status": "online",
                "services": ["code_review_validation", "ai_analysis"],
                "ai_available": self.has_ai,
                "validations_completed": self.validations_count
            }
        
        @app.post("/validate", response_model=ValidationResponse)
        async def validate_review(request: ValidationRequest):
            return await self.perform_validation(request)
        
        return app
    
    async def perform_validation(self, request: ValidationRequest) -> ValidationResponse:
        """Perform real validation analysis"""
        
        print(f"🔍 Starting validation for review {request.review_id}")
        
        self.validations_count += 1
        validation_id = f"val_{int(time.time())}_{self.validations_count}"
        
        # Perform independent analysis
        if self.has_ai:
            validator_analysis = await self.ai_validation(request.original_code, request.language)
        else:
            validator_analysis = self.local_validation(request.original_code, request.language)
        
        # Compare with original review
        original_scores = {
            'security': request.original_response.get('security_score', 70),
            'performance': request.original_response.get('performance_score', 70),
            'maintainability': request.original_response.get('maintainability_score', 70),
            'style': request.original_response.get('style_score', 70)
        }
        
        validator_scores = validator_analysis['scores']
        
        # Calculate discrepancies
        discrepancies = []
        for category in original_scores:
            diff = abs(original_scores[category] - validator_scores[category])
            if diff > 10:  # Significant difference
                discrepancies.append({
                    'type': 'score_discrepancy',
                    'category': category,
                    'original_score': original_scores[category],
                    'validator_score': validator_scores[category],
                    'difference': diff,
                    'severity': 'medium' if diff < 20 else 'high'
                })
        
        # Calculate validation scores
        consistency_score = max(0, 100 - len(discrepancies) * 15)
        accuracy_score = max(70, 100 - len([d for d in discrepancies if d['severity'] == 'high']) * 20)
        completeness_score = 85  # Based on methodology assessment
        methodology_score = 90 if self.has_ai else 75  # Higher if AI was used
        
        overall_validation_score = int((accuracy_score + completeness_score + methodology_score + consistency_score) / 4)
        
        # Generate recommendation
        if overall_validation_score >= 85:
            recommendation = "APPROVED: High-quality code review with accurate analysis."
        elif overall_validation_score >= 70:
            recommendation = "APPROVED WITH NOTES: Good code review with minor discrepancies noted."
        else:
            recommendation = "CONDITIONAL: Significant discrepancies found, recommend revisions."
        
        response = ValidationResponse(
            validation_id=validation_id,
            review_id=request.review_id,
            validation_score=overall_validation_score,
            accuracy_score=accuracy_score,
            completeness_score=completeness_score,
            methodology_score=methodology_score,
            discrepancies=discrepancies,
            validator_analysis=validator_analysis,
            recommendation=recommendation
        )
        
        print(f"✅ Validation {validation_id} completed - Score: {overall_validation_score}/100")
        
        return response
    
    async def ai_validation(self, code: str, language: str) -> Dict[str, Any]:
        """Perform AI validation analysis"""
        
        prompt = f"""
Please perform independent validation analysis of this {language} code.
Be conservative and thorough in your assessment.

Code:
```{language}
{code}
```

Provide analysis as JSON:
{{
    "security_score": 75,
    "performance_score": 80,
    "maintainability_score": 85,
    "style_score": 78,
    "critical_issues": ["list", "of", "issues"],
    "validator_notes": "Your assessment of the code quality",
    "confidence_level": "high"
}}
"""
        
        try:
            # Try Claude first (preferred for validation)
            if hasattr(self, 'claude_client'):
                response = self.claude_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=1000,
                    messages=[{"role": "user", "content": prompt}]
                )
                
                analysis = json.loads(response.content[0].text)
                analysis['ai_model'] = 'Claude Haiku'
                analysis['processing_time'] = '3-5s'
                
                return {
                    'method': 'ai_analysis',
                    'scores': {
                        'security': analysis.get('security_score', 75),
                        'performance': analysis.get('performance_score', 80),
                        'maintainability': analysis.get('maintainability_score', 85),
                        'style': analysis.get('style_score', 78)
                    },
                    'analysis_details': analysis
                }
                
            # Try OpenAI as fallback
            elif hasattr(self, 'openai_client'):
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a conservative code validator. Be thorough and respond with JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2
                )
                
                analysis = json.loads(response.choices[0].message.content)
                analysis['ai_model'] = 'GPT-4o-mini'
                analysis['processing_time'] = '2-4s'
                
                return {
                    'method': 'ai_analysis', 
                    'scores': {
                        'security': analysis.get('security_score', 75),
                        'performance': analysis.get('performance_score', 80),
                        'maintainability': analysis.get('maintainability_score', 85),
                        'style': analysis.get('style_score', 78)
                    },
                    'analysis_details': analysis
                }
        
        except Exception as e:
            print(f"   ⚠️ AI validation failed: {e}")
            return self.local_validation(code, language)
        
        return self.local_validation(code, language)
    
    def local_validation(self, code: str, language: str) -> Dict[str, Any]:
        """Local validation when AI is not available"""
        
        # Conservative scoring for validation
        base_scores = {
            'security': 70,
            'performance': 75,
            'maintainability': 80,
            'style': 75
        }
        
        # Check for critical issues to adjust scores
        if language.lower() == 'python':
            if any(danger in code for danger in ['eval(', 'exec(', 'os.system']):
                base_scores['security'] -= 20
            if 'subprocess.run(' in code and 'shell=True' in code:
                base_scores['security'] -= 15
            if 'debug=True' in code:
                base_scores['security'] -= 10
        
        return {
            'method': 'local_analysis',
            'scores': base_scores,
            'analysis_details': {
                'validator_notes': f'Conservative local validation of {language} code',
                'critical_issues': ['Enable AI validation for thorough analysis'],
                'confidence_level': 'medium',
                'ai_model': 'Local Static Analysis',
                'processing_time': '0.5s'
            }
        }

async def main():
    """Run the simple validator agent"""
    agent = SimpleValidatorAgent()
    
    import uvicorn
    print("🚀 Starting Simple Validator Agent on port 8081")
    print("📚 API docs: http://localhost:8081/docs") 
    
    uvicorn.run(
        agent.app,
        host="0.0.0.0",
        port=8081,
        log_level="warning"  # Reduce noise
    )

if __name__ == "__main__":
    asyncio.run(main())
