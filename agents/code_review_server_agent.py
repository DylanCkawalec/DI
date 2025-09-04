"""
ERC-8004 AI Code Review Server Agent

This agent provides AI-powered code review services using CrewAI and multiple LLMs.
It analyzes code for security, performance, maintainability, and best practices.
"""

import os
import sys
import json
import hashlib
import asyncio
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime
import tempfile

# Core dependencies
from .base_agent import ERC8004BaseAgent

# AI and analysis tools
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

# Grok API support (using OpenAI-compatible interface)
try:
    import httpx
    GROK_AVAILABLE = True
except ImportError:
    GROK_AVAILABLE = False

# Code analysis tools
import ast
import re
import subprocess
from collections import defaultdict

# FastAPI for API endpoints
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class CodeReviewRequest(BaseModel):
    """Request model for code review"""
    code: str
    language: str
    filename: str
    description: Optional[str] = None
    focus_areas: Optional[List[str]] = ["security", "performance", "maintainability", "style"]

class CodeReviewResponse(BaseModel):
    """Response model for code review"""
    review_id: str
    overall_score: int  # 0-100
    security_score: int
    performance_score: int
    maintainability_score: int
    style_score: int
    issues: List[Dict[str, Any]]
    recommendations: List[str]
    analysis_details: Dict[str, Any]

class CodeReviewServerAgent(ERC8004BaseAgent):
    """AI Code Review Server Agent implementing ERC-8004"""
    
    def __init__(self, private_key: str, agent_domain: str = "code-review-ai.erc8004.dev"):
        super().__init__(agent_domain, private_key)
        
        # Initialize AI clients
        self.openai_client = None
        self.anthropic_client = None
        self._init_ai_clients()
        
        # Code review storage
        self.reviews_storage = Path("data/code_reviews")
        self.reviews_storage.mkdir(parents=True, exist_ok=True)
        
        # Initialize FastAPI app
        self.app = self._create_api_app()
        
        print(f"🤖 Code Review Server Agent initialized")
        print(f"   Domain: {self.agent_domain}")
        print(f"   Address: {self.address}")
        print(f"   OpenAI: {'✅ Available' if self.openai_client else '❌ Not configured'}")
        print(f"   Grok: {'✅ Available' if self.grok_client else '❌ Not configured'}")
        print(f"   Anthropic: {'✅ Available' if self.anthropic_client else '❌ Not configured'}")

    def _init_ai_clients(self):
        """Initialize AI clients if API keys are available"""
        if OPENAI_AVAILABLE and os.getenv('OPENAI_API_KEY'):
            self.openai_client = openai.OpenAI()
            
        if ANTHROPIC_AVAILABLE and os.getenv('ANTHROPIC_API_KEY'):
            self.anthropic_client = anthropic.Anthropic()
        
        # Initialize Grok client (uses OpenAI-compatible interface)
        if GROK_AVAILABLE and os.getenv('GROK_API_KEY'):
            self.grok_client = openai.OpenAI(
                api_key=os.getenv('GROK_API_KEY'),
                base_url="https://api.x.ai/v1"
            )
        else:
            self.grok_client = None

    def _create_api_app(self) -> FastAPI:
        """Create FastAPI application for the code review service"""
        app = FastAPI(
            title="ERC-8004 AI Code Review Service",
            description="AI-powered code review service using the ERC-8004 trustless agent standard",
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
        
        @app.post("/review", response_model=CodeReviewResponse)
        async def review_code(request: CodeReviewRequest):
            """Main endpoint for code review requests"""
            try:
                return await self._perform_code_review(request)
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/agent/info")
        async def get_agent_info():
            """Get agent information"""
            return {
                "agent_id": self.agent_id,
                "agent_domain": self.agent_domain,
                "agent_address": self.address,
                "services": ["code_review", "security_audit", "performance_analysis"],
                "supported_languages": ["python", "javascript", "typescript", "solidity", "go", "rust"],
                "trust_models": ["feedback", "inference-validation", "tee-attestation"]
            }
        
        @app.get("/reviews/{review_id}")
        async def get_review(review_id: str):
            """Get a specific review by ID"""
            review_path = self.reviews_storage / f"{review_id}.json"
            if not review_path.exists():
                raise HTTPException(status_code=404, detail="Review not found")
                
            with open(review_path, 'r') as f:
                return json.load(f)
        
        return app

    async def _perform_code_review(self, request: CodeReviewRequest) -> CodeReviewResponse:
        """Perform comprehensive code review using AI and static analysis"""
        
        # Generate unique review ID
        review_id = hashlib.sha256(
            f"{request.code}{request.filename}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        
        print(f"🔍 Starting code review {review_id} for {request.filename}")
        
        # Step 1: Static analysis
        static_results = await self._static_analysis(request.code, request.language)
        
        # Step 2: AI analysis (if available)
        ai_results = await self._ai_analysis(request.code, request.language, request.focus_areas)
        
        # Step 3: Combine and score results
        combined_results = self._combine_analysis_results(static_results, ai_results)
        
        # Step 4: Generate response
        response = CodeReviewResponse(
            review_id=review_id,
            overall_score=combined_results['overall_score'],
            security_score=combined_results['security_score'],
            performance_score=combined_results['performance_score'],
            maintainability_score=combined_results['maintainability_score'],
            style_score=combined_results['style_score'],
            issues=combined_results['issues'],
            recommendations=combined_results['recommendations'],
            analysis_details=combined_results['details']
        )
        
        # Step 5: Store review for validation and audit trail
        await self._store_review(review_id, request, response)
        
        print(f"✅ Code review {review_id} completed - Score: {response.overall_score}/100")
        
        return response

    async def _static_analysis(self, code: str, language: str) -> Dict[str, Any]:
        """Perform static code analysis using built-in tools"""
        results = {
            'security_issues': [],
            'performance_issues': [],
            'style_issues': [],
            'complexity_metrics': {},
            'scores': {}
        }
        
        if language.lower() == 'python':
            results.update(await self._analyze_python_code(code))
        elif language.lower() in ['javascript', 'typescript']:
            results.update(await self._analyze_js_code(code))
        elif language.lower() == 'solidity':
            results.update(await self._analyze_solidity_code(code))
        else:
            # Generic analysis for other languages
            results.update(await self._generic_code_analysis(code))
        
        return results

    async def _analyze_python_code(self, code: str) -> Dict[str, Any]:
        """Analyze Python code using AST and other tools"""
        results = {
            'security_issues': [],
            'performance_issues': [],
            'style_issues': [],
            'complexity_metrics': {},
            'scores': {}
        }
        
        try:
            # Parse AST
            tree = ast.parse(code)
            
            # Check for security issues
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if hasattr(node.func, 'id'):
                        if node.func.id in ['eval', 'exec']:
                            results['security_issues'].append({
                                'type': 'dangerous_function',
                                'message': f'Dangerous function {node.func.id} detected',
                                'line': node.lineno,
                                'severity': 'high'
                            })
                        elif node.func.id in ['open'] and len(node.args) > 1:
                            # Check for file operations without proper validation
                            results['security_issues'].append({
                                'type': 'file_operation',
                                'message': 'File operation detected - ensure input validation',
                                'line': node.lineno,
                                'severity': 'medium'
                            })
            
            # Calculate complexity metrics
            functions = [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
            classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
            
            results['complexity_metrics'] = {
                'functions': len(functions),
                'classes': len(classes),
                'lines': len(code.split('\n'))
            }
            
            # Calculate scores based on findings
            security_score = max(0, 100 - len(results['security_issues']) * 20)
            performance_score = 85 if len(functions) < 10 else 70  # Simple heuristic
            style_score = 80  # Default, would be better with real linting
            
            results['scores'] = {
                'security': security_score,
                'performance': performance_score,
                'style': style_score
            }
            
        except SyntaxError as e:
            results['security_issues'].append({
                'type': 'syntax_error',
                'message': f'Syntax error: {str(e)}',
                'line': e.lineno if hasattr(e, 'lineno') else 0,
                'severity': 'critical'
            })
        
        return results

    async def _analyze_js_code(self, code: str) -> Dict[str, Any]:
        """Analyze JavaScript/TypeScript code"""
        results = {
            'security_issues': [],
            'performance_issues': [],
            'style_issues': [],
            'complexity_metrics': {},
            'scores': {'security': 75, 'performance': 75, 'style': 75}
        }
        
        # Basic pattern matching for common issues
        if 'eval(' in code:
            results['security_issues'].append({
                'type': 'dangerous_function',
                'message': 'eval() function detected - potential security risk',
                'severity': 'high'
            })
        
        if 'innerHTML' in code:
            results['security_issues'].append({
                'type': 'xss_risk',
                'message': 'innerHTML usage detected - potential XSS risk',
                'severity': 'medium'
            })
        
        return results

    async def _analyze_solidity_code(self, code: str) -> Dict[str, Any]:
        """Analyze Solidity smart contract code"""
        results = {
            'security_issues': [],
            'performance_issues': [],
            'style_issues': [],
            'complexity_metrics': {},
            'scores': {'security': 75, 'performance': 75, 'style': 75}
        }
        
        # Common Solidity security patterns
        if 'tx.origin' in code:
            results['security_issues'].append({
                'type': 'tx_origin_usage',
                'message': 'tx.origin usage detected - use msg.sender instead',
                'severity': 'high'
            })
        
        if re.search(r'\.call\(', code):
            results['security_issues'].append({
                'type': 'low_level_call',
                'message': 'Low-level call detected - ensure proper error handling',
                'severity': 'medium'
            })
        
        return results

    async def _generic_code_analysis(self, code: str) -> Dict[str, Any]:
        """Generic analysis for unsupported languages"""
        return {
            'security_issues': [],
            'performance_issues': [],
            'style_issues': [],
            'complexity_metrics': {'lines': len(code.split('\n'))},
            'scores': {'security': 70, 'performance': 70, 'style': 70}
        }

    async def _ai_analysis(self, code: str, language: str, focus_areas: List[str]) -> Optional[Dict[str, Any]]:
        """Perform AI-powered code analysis using available LLMs (prioritize cheapest)"""
        if not (self.grok_client or self.openai_client or self.anthropic_client):
            return self._fallback_ai_analysis(code, language, focus_areas)
        
        prompt = self._create_analysis_prompt(code, language, focus_areas)
        
        try:
            # Try Grok first (cheapest and most capable option)
            if self.grok_client:
                return await self._analyze_with_grok(prompt)
            # Then Claude (good balance of cost and quality)
            elif self.anthropic_client:
                return await self._analyze_with_anthropic(prompt)
            # Finally OpenAI (backup)
            elif self.openai_client:
                return await self._analyze_with_openai(prompt)
        except Exception as e:
            print(f"⚠️  AI analysis failed: {e}, falling back to rule-based analysis")
            return self._fallback_ai_analysis(code, language, focus_areas)

    def _create_analysis_prompt(self, code: str, language: str, focus_areas: List[str]) -> str:
        """Create a comprehensive analysis prompt for LLMs"""
        return f"""
Please perform a comprehensive code review of the following {language} code.

Focus Areas: {', '.join(focus_areas)}

Code:
```{language}
{code}
```

Please analyze the code and provide:
1. Security issues (rate 0-100)
2. Performance issues (rate 0-100)  
3. Maintainability issues (rate 0-100)
4. Style/best practices (rate 0-100)
5. Specific recommendations for improvement

Format your response as JSON with the following structure:
{{
    "security_score": 85,
    "performance_score": 78,
    "maintainability_score": 90,
    "style_score": 82,
    "issues": [
        {{"type": "security", "message": "...", "line": 10, "severity": "medium"}},
        {{"type": "performance", "message": "...", "line": 15, "severity": "low"}}
    ],
    "recommendations": ["...", "..."],
    "summary": "Overall code quality assessment..."
}}
"""

    async def _analyze_with_grok(self, prompt: str) -> Dict[str, Any]:
        """Analyze code using Grok (optimized for speed and cost)"""
        response = self.grok_client.chat.completions.create(
            model="grok-4-latest",  # Using latest Grok model
            messages=[
                {"role": "system", "content": "You are a fast, expert code security reviewer. Respond only with valid JSON. Be concise but thorough."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistency
            stream=False,
            max_tokens=1000  # Limit tokens for faster response
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return self._parse_llm_response_fallback(response.choices[0].message.content)

    async def _analyze_with_openai(self, prompt: str) -> Dict[str, Any]:
        """Analyze code using OpenAI GPT models (using cheapest model)"""
        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",  # Cheapest OpenAI model
            messages=[
                {"role": "system", "content": "You are an expert code reviewer specializing in security, performance, and best practices."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return self._parse_llm_response_fallback(response.choices[0].message.content)

    async def _analyze_with_anthropic(self, prompt: str) -> Dict[str, Any]:
        """Analyze code using Anthropic Claude (using cheapest model)"""
        response = self.anthropic_client.messages.create(
            model="claude-3-haiku-20240307",  # Cheapest Claude model
            max_tokens=1500,  # Reduce tokens for cost
            messages=[{"role": "user", "content": prompt}]
        )
        
        try:
            return json.loads(response.content[0].text)
        except json.JSONDecodeError:
            return self._parse_llm_response_fallback(response.content[0].text)

    def _fallback_ai_analysis(self, code: str, language: str, focus_areas: List[str]) -> Dict[str, Any]:
        """Fallback analysis when AI APIs are not available"""
        return {
            "security_score": 75,
            "performance_score": 80,
            "maintainability_score": 85,
            "style_score": 78,
            "issues": [
                {"type": "info", "message": "AI analysis not available - using static analysis only", "severity": "info"}
            ],
            "recommendations": [
                "Enable AI analysis by setting OPENAI_API_KEY or ANTHROPIC_API_KEY for enhanced code review",
                f"Consider using language-specific linters for {language} code",
                "Implement comprehensive unit tests",
                "Add documentation for better maintainability"
            ],
            "summary": "Static analysis completed successfully. Enable AI analysis for more comprehensive reviews."
        }

    def _parse_llm_response_fallback(self, response_text: str) -> Dict[str, Any]:
        """Parse LLM response when JSON parsing fails"""
        # Extract scores using regex
        scores = {
            'security_score': 75,
            'performance_score': 75,
            'maintainability_score': 75,
            'style_score': 75
        }
        
        for score_type in scores.keys():
            match = re.search(f'{score_type}[^0-9]*([0-9]+)', response_text, re.IGNORECASE)
            if match:
                scores[score_type] = int(match.group(1))
        
        return {
            **scores,
            "issues": [{"type": "info", "message": "AI response parsing failed - scores estimated", "severity": "info"}],
            "recommendations": ["Enable structured AI responses for better analysis"],
            "summary": response_text[:200] + "..." if len(response_text) > 200 else response_text
        }

    def _combine_analysis_results(self, static_results: Dict[str, Any], ai_results: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine static analysis and AI analysis results"""
        
        # Base scores from static analysis
        security_score = static_results.get('scores', {}).get('security', 70)
        performance_score = static_results.get('scores', {}).get('performance', 70)
        maintainability_score = static_results.get('scores', {}).get('maintainability', 70)
        style_score = static_results.get('scores', {}).get('style', 70)
        
        # Combine with AI scores if available
        if ai_results:
            security_score = int((security_score + ai_results.get('security_score', 70)) / 2)
            performance_score = int((performance_score + ai_results.get('performance_score', 70)) / 2)
            maintainability_score = int((maintainability_score + ai_results.get('maintainability_score', 70)) / 2)
            style_score = int((style_score + ai_results.get('style_score', 70)) / 2)
        
        # Calculate overall score
        overall_score = int((security_score + performance_score + maintainability_score + style_score) / 4)
        
        # Combine issues
        all_issues = static_results.get('security_issues', []) + static_results.get('performance_issues', [])
        if ai_results:
            all_issues.extend(ai_results.get('issues', []))
        
        # Combine recommendations
        recommendations = []
        if ai_results:
            recommendations.extend(ai_results.get('recommendations', []))
        
        # Add static analysis recommendations
        if static_results.get('security_issues'):
            recommendations.append("Address security issues identified in static analysis")
        if static_results.get('complexity_metrics', {}).get('functions', 0) > 15:
            recommendations.append("Consider breaking down large functions for better maintainability")
        
        return {
            'overall_score': overall_score,
            'security_score': security_score,
            'performance_score': performance_score,
            'maintainability_score': maintainability_score,
            'style_score': style_score,
            'issues': all_issues,
            'recommendations': recommendations,
            'details': {
                'static_analysis': static_results,
                'ai_analysis': ai_results,
                'timestamp': datetime.now().isoformat()
            }
        }

    async def _store_review(self, review_id: str, request: CodeReviewRequest, response: CodeReviewResponse):
        """Store review data for validation and audit trail"""
        review_data = {
            'review_id': review_id,
            'agent_id': self.agent_id,
            'timestamp': datetime.now().isoformat(),
            'request': request.model_dump(),
            'response': response.model_dump(),
            'data_hash': hashlib.sha256(request.code.encode()).hexdigest()
        }
        
        review_path = self.reviews_storage / f"{review_id}.json"
        with open(review_path, 'w') as f:
            json.dump(review_data, f, indent=2)
        
        print(f"📁 Review {review_id} stored for validation")

    async def run_server(self, host: str = "0.0.0.0", port: int = 8080):
        """Run the code review service server"""
        import uvicorn
        
        print(f"🚀 Starting Code Review Server Agent on {host}:{port}")
        print(f"📡 Agent ID: {self.agent_id}")
        print(f"🌐 Domain: {self.agent_domain}")
        print(f"📚 API Documentation: http://{host}:{port}/docs")
        
        uvicorn.run(self.app, host=host, port=port)

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Example usage
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        print("❌ Error: PRIVATE_KEY not set in environment variables")
        print("Please set PRIVATE_KEY in your .env file")
        sys.exit(1)
    
    agent = CodeReviewServerAgent(private_key)
    
    # Register with ERC-8004 if not already registered
    if not agent.agent_id:
        agent.register_agent()
    
    # Run the server
    asyncio.run(agent.run_server())
