#!/usr/bin/env python3
"""
🛡️ WORKING VALIDATOR AGENT

Simple, bulletproof validator agent that actually works.
No complex dependencies, no asyncio issues, pure functionality.
"""

import os
import sys
import json
import time
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Load environment
from dotenv import load_dotenv
load_dotenv()

# Simple request/response models
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
    discrepancies: List[Dict[str, Any]]
    validator_analysis: Dict[str, Any]
    recommendation: str

class WorkingValidatorAgent:
    """Simple, working validator agent"""
    
    def __init__(self):
        self.agent_id = 1001
        self.validations_count = 0
        self.app = self.create_app()
        
        # Initialize AI if available
        self.has_ai = self.init_ai_clients()
        
        print("🛡️ Working Validator Agent initialized")
        print(f"   Agent ID: {self.agent_id}")
        print(f"   AI Available: {'✅ Yes' if self.has_ai else '❌ No (using local analysis)'}")
    
    def init_ai_clients(self) -> bool:
        """Initialize AI clients safely"""
        try:
            # Try Claude first
            if os.getenv('ANTHROPIC_API_KEY'):
                import anthropic
                self.claude_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
                print("   ✅ Claude AI connected")
                return True
        except Exception as e:
            print(f"   ⚠️ Claude failed: {e}")
        
        try:
            # Try OpenAI as backup
            if os.getenv('OPENAI_API_KEY'):
                import openai
                self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                print("   ✅ OpenAI connected")
                return True
        except Exception as e:
            print(f"   ⚠️ OpenAI failed: {e}")
        
        print("   ⚠️ No AI providers available - using local analysis")
        return False
    
    def create_app(self) -> FastAPI:
        """Create simple FastAPI app"""
        app = FastAPI(
            title="Working ERC-8004 Validator",
            description="Simple, bulletproof validator agent",
            version="1.0.0"
        )
        
        # CORS
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"]
        )
        
        @app.get("/")
        def root():
            return {
                "message": "Working Validator Agent",
                "status": "online",
                "agent_id": self.agent_id,
                "validations_completed": self.validations_count
            }
        
        @app.get("/health")
        def health():
            return {
                "status": "healthy",
                "agent_id": self.agent_id,
                "ai_available": self.has_ai,
                "timestamp": time.time()
            }
        
        @app.get("/agent/info")
        def agent_info():
            return {
                "agent_id": self.agent_id,
                "domain": "working-validator.erc8004.dev",
                "status": "online",
                "services": ["code_review_validation", "ai_analysis"],
                "ai_available": self.has_ai,
                "validations_completed": self.validations_count
            }
        
        @app.post("/validate", response_model=ValidationResponse)
        def validate_review(request: ValidationRequest):
            return self.perform_validation(request)
        
        return app
    
    def perform_validation(self, request: ValidationRequest) -> ValidationResponse:
        """Perform validation - simple and working"""
        
        print(f"🔍 Validating review {request.review_id}")
        
        self.validations_count += 1
        validation_id = f"val_{int(time.time())}_{self.validations_count}"
        
        # Get original scores
        original_response = request.original_response
        original_scores = {
            'security': original_response.get('security_score', 70),
            'performance': original_response.get('performance_score', 75),
            'maintainability': original_response.get('maintainability_score', 80),
            'style': original_response.get('style_score', 75)
        }
        
        # Perform independent analysis
        if self.has_ai:
            validator_scores = self.ai_analysis(request.original_code, request.language)
        else:
            validator_scores = self.local_analysis(request.original_code, request.language)
        
        # Calculate discrepancies
        discrepancies = []
        for category in original_scores:
            original = original_scores[category]
            validator = validator_scores[category]
            diff = abs(original - validator)
            
            if diff > 15:  # Significant difference
                discrepancies.append({
                    'type': 'score_discrepancy',
                    'category': category,
                    'original_score': original,
                    'validator_score': validator,
                    'difference': diff,
                    'severity': 'high' if diff > 25 else 'medium'
                })
        
        # Calculate validation scores
        consistency_score = max(0, 100 - len(discrepancies) * 20)
        accuracy_score = max(60, 100 - len([d for d in discrepancies if d['severity'] == 'high']) * 25)
        completeness_score = 85 if self.has_ai else 75
        methodology_score = 90 if self.has_ai else 80
        
        overall_score = int((accuracy_score + completeness_score + methodology_score + consistency_score) / 4)
        
        # Generate recommendation
        if overall_score >= 85:
            recommendation = "APPROVED: High-quality code review with accurate analysis."
        elif overall_score >= 70:
            recommendation = "APPROVED WITH NOTES: Good code review with minor issues noted."
        else:
            recommendation = "CONDITIONAL: Significant discrepancies found."
        
        # Create response
        response = ValidationResponse(
            validation_id=validation_id,
            review_id=request.review_id,
            validation_score=overall_score,
            accuracy_score=accuracy_score,
            completeness_score=completeness_score,
            methodology_score=methodology_score,
            discrepancies=discrepancies,
            validator_analysis={
                'method': 'ai_analysis' if self.has_ai else 'local_analysis',
                'validator_scores': validator_scores,
                'original_scores': original_scores,
                'language': request.language,
                'processing_time': '2-5s' if self.has_ai else '0.5s'
            },
            recommendation=recommendation
        )
        
        print(f"✅ Validation {validation_id} completed - Score: {overall_score}/100")
        
        return response
    
    def ai_analysis(self, code: str, language: str) -> Dict[str, int]:
        """Real AI analysis for validation"""
        
        prompt = f"""
Analyze this {language} code and rate each category 0-100:

Code:
```{language}
{code}
```

Respond ONLY with JSON:
{{
    "security": 85,
    "performance": 78,
    "maintainability": 90,
    "style": 82
}}
"""
        
        try:
            # Try Claude first
            if hasattr(self, 'claude_client'):
                response = self.claude_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}]
                )
                
                result = json.loads(response.content[0].text)
                print(f"   ✅ Claude validation complete")
                return result
                
            # Try OpenAI
            elif hasattr(self, 'openai_client'):
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "Respond only with JSON scores."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=200
                )
                
                result = json.loads(response.choices[0].message.content)
                print(f"   ✅ OpenAI validation complete")
                return result
                
        except Exception as e:
            print(f"   ⚠️ AI analysis failed: {e}")
            
        # Fallback to local
        return self.local_analysis(code, language)
    
    def local_analysis(self, code: str, language: str) -> Dict[str, int]:
        """Local analysis fallback"""
        
        scores = {
            'security': 75,
            'performance': 80,
            'maintainability': 85,
            'style': 78
        }
        
        # Basic pattern checking
        if language.lower() == 'python':
            # Security checks
            if any(danger in code for danger in ['eval(', 'exec(', 'os.system(']):
                scores['security'] -= 25
            if 'subprocess.run(' in code and 'shell=True' in code:
                scores['security'] -= 20
            if 'debug=True' in code:
                scores['security'] -= 10
            
            # Performance checks
            nested_loops = code.count('for ') + code.count('while ')
            if nested_loops > 3:
                scores['performance'] -= 15
            
            # Style checks
            if len(code.split('\n')) > 100:
                scores['style'] -= 10
        
        print(f"   ✅ Local validation complete")
        return scores

def run_validator():
    """Run validator agent directly without asyncio issues"""
    agent = WorkingValidatorAgent()
    
    print("🚀 Starting Working Validator Agent on port 8081")
    print("📚 API docs: http://localhost:8081/docs")
    
    # Use uvicorn.run directly to avoid asyncio issues
    uvicorn.run(
        agent.app,
        host="0.0.0.0",
        port=8081,
        log_level="error"  # Reduce noise
    )

if __name__ == "__main__":
    run_validator()
