"""
ERC-8004 AI Code Review Validator Agent

This agent validates the quality of code reviews provided by server agents.
It re-analyzes the code and compares results to ensure review accuracy and completeness.
"""

import os
import sys
import json
import hashlib
import asyncio
import ast
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

# Core dependencies
from .base_agent import ERC8004BaseAgent

# Import required types (avoiding circular imports)
try:
    from .code_review_server_agent import CodeReviewRequest, CodeReviewResponse
except ImportError:
    # Define locally if import fails
    from pydantic import BaseModel
    from typing import Dict, List, Any, Optional
    
    class CodeReviewRequest(BaseModel):
        code: str
        language: str
        filename: str
        description: Optional[str] = None
        focus_areas: Optional[List[str]] = ["security", "performance", "maintainability", "style"]
    
    class CodeReviewResponse(BaseModel):
        review_id: str
        overall_score: int
        security_score: int
        performance_score: int
        maintainability_score: int
        style_score: int
        issues: List[Dict[str, Any]]
        recommendations: List[str]
        analysis_details: Dict[str, Any]

# AI and analysis tools
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# FastAPI for API endpoints
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class ValidationRequest(BaseModel):
    """Request model for validation"""
    review_id: str
    original_code: str
    original_response: Dict[str, Any]
    server_agent_id: int

class ValidationResponse(BaseModel):
    """Response model for validation"""
    validation_id: str
    review_id: str
    validation_score: int  # 0-100
    accuracy_score: int
    completeness_score: int
    methodology_score: int
    discrepancies: List[Dict[str, Any]]
    validator_analysis: Dict[str, Any]
    recommendation: str

class CodeReviewValidatorAgent(ERC8004BaseAgent):
    """AI Code Review Validator Agent implementing ERC-8004"""
    
    def __init__(self, private_key: str, agent_domain: str = "validator-ai.erc8004.dev"):
        super().__init__(agent_domain, private_key)
        
        # Initialize AI clients
        self.openai_client = None
        self.anthropic_client = None
        self._init_ai_clients()
        
        # Validation storage
        self.validations_storage = Path("validations")
        self.validations_storage.mkdir(parents=True, exist_ok=True)
        
        # Initialize FastAPI app
        self.app = self._create_api_app()
        
        print(f"🛡️  Code Review Validator Agent initialized")
        print(f"   Domain: {self.agent_domain}")
        print(f"   Address: {self.address}")
        print(f"   OpenAI: {'✅ Available' if self.openai_client else '❌ Not configured'}")

    def _init_ai_clients(self):
        """Initialize AI clients if API keys are available"""
        if OPENAI_AVAILABLE and os.getenv('OPENAI_API_KEY'):
            self.openai_client = openai.OpenAI()
        else:
            self.openai_client = None

    def _create_api_app(self) -> FastAPI:
        """Create FastAPI application for the validation service"""
        app = FastAPI(
            title="ERC-8004 AI Code Review Validator",
            description="AI-powered code review validation service using the ERC-8004 trustless agent standard",
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
        
        @app.post("/validate", response_model=ValidationResponse)
        async def validate_review(request: ValidationRequest):
            """Main endpoint for code review validation"""
            try:
                return await self._validate_code_review(request)
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/agent/info")
        async def get_agent_info():
            """Get validator agent information"""
            return {
                "agent_id": self.agent_id,
                "agent_domain": self.agent_domain,
                "agent_address": self.address,
                "services": ["code_review_validation", "quality_assurance", "methodology_verification"],
                "validation_criteria": ["accuracy", "completeness", "methodology", "consistency"],
                "trust_models": ["feedback", "inference-validation", "tee-attestation"]
            }
        
        @app.get("/validations/{validation_id}")
        async def get_validation(validation_id: str):
            """Get a specific validation by ID"""
            validation_path = self.validations_storage / f"{validation_id}.json"
            if not validation_path.exists():
                raise HTTPException(status_code=404, detail="Validation not found")
                
            with open(validation_path, 'r') as f:
                return json.load(f)
        
        return app

    async def _validate_code_review(self, request: ValidationRequest) -> ValidationResponse:
        """Validate a code review by re-analyzing the code and comparing results"""
        
        # Generate unique validation ID
        validation_id = hashlib.sha256(
            f"{request.review_id}{request.server_agent_id}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        
        print(f"🔍 Starting validation {validation_id} for review {request.review_id}")
        
        # Step 1: Perform independent analysis of the original code
        independent_analysis = await self._perform_independent_analysis(
            request.original_code, 
            request.original_response
        )
        
        # Step 2: Compare with original review
        comparison_results = await self._compare_analyses(
            request.original_response,
            independent_analysis
        )
        
        # Step 3: Calculate validation scores
        scores = self._calculate_validation_scores(comparison_results)
        
        # Step 4: Generate validation response
        response = ValidationResponse(
            validation_id=validation_id,
            review_id=request.review_id,
            validation_score=scores['overall_score'],
            accuracy_score=scores['accuracy_score'],
            completeness_score=scores['completeness_score'],
            methodology_score=scores['methodology_score'],
            discrepancies=comparison_results['discrepancies'],
            validator_analysis=independent_analysis,
            recommendation=self._generate_recommendation(scores, comparison_results)
        )
        
        # Step 5: Store validation for audit trail
        await self._store_validation(validation_id, request, response)
        
        print(f"✅ Validation {validation_id} completed - Score: {response.validation_score}/100")
        
        return response

    async def _perform_independent_analysis(self, code: str, original_response: Dict[str, Any]) -> Dict[str, Any]:
        """Perform independent analysis of the code to validate the original review"""
        
        # Extract language and filename from original response if available
        language = original_response.get('analysis_details', {}).get('static_analysis', {}).get('language', 'python')
        
        # Perform comprehensive re-analysis
        analysis_results = {
            'static_analysis': await self._independent_static_analysis(code, language),
            'ai_analysis': await self._independent_ai_analysis(code, language),
            'security_assessment': await self._independent_security_analysis(code, language),
            'methodology_check': await self._verify_analysis_methodology(original_response)
        }
        
        return analysis_results

    async def _independent_static_analysis(self, code: str, language: str) -> Dict[str, Any]:
        """Perform independent static analysis"""
        # Use similar logic to the server agent but with different thresholds
        if language.lower() == 'python':
            return await self._validate_python_analysis(code)
        elif language.lower() in ['javascript', 'typescript']:
            return await self._validate_js_analysis(code)
        elif language.lower() == 'solidity':
            return await self._validate_solidity_analysis(code)
        else:
            return await self._validate_generic_analysis(code)

    async def _validate_python_analysis(self, code: str) -> Dict[str, Any]:
        """Independent Python code analysis for validation"""
        import ast
        
        results = {
            'security_issues': [],
            'performance_issues': [],
            'style_issues': [],
            'complexity_metrics': {},
            'validator_scores': {}
        }
        
        try:
            tree = ast.parse(code)
            
            # More thorough security analysis than server agent
            dangerous_functions = ['eval', 'exec', 'compile', '__import__']
            file_operations = ['open', 'file']
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if hasattr(node.func, 'id'):
                        if node.func.id in dangerous_functions:
                            results['security_issues'].append({
                                'type': 'critical_security',
                                'function': node.func.id,
                                'line': node.lineno,
                                'severity': 'critical',
                                'validator_note': 'Validator detected critical security issue'
                            })
                        elif node.func.id in file_operations:
                            results['security_issues'].append({
                                'type': 'file_security',
                                'function': node.func.id,
                                'line': node.lineno,
                                'severity': 'medium',
                                'validator_note': 'Validator flagged potential file security concern'
                            })
            
            # Check for complex nested structures
            max_depth = 0
            for node in ast.walk(tree):
                if isinstance(node, (ast.For, ast.While, ast.If, ast.With)):
                    depth = self._calculate_nesting_depth(node)
                    max_depth = max(max_depth, depth)
            
            results['complexity_metrics'] = {
                'max_nesting_depth': max_depth,
                'functions': len([n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]),
                'classes': len([n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]),
                'lines': len(code.split('\n'))
            }
            
            # Validator scoring (often more conservative)
            security_score = max(0, 90 - len(results['security_issues']) * 25)
            performance_score = 80 if max_depth <= 3 else 60
            maintainability_score = 85 if results['complexity_metrics']['functions'] <= 8 else 65
            
            results['validator_scores'] = {
                'security': security_score,
                'performance': performance_score,
                'maintainability': maintainability_score,
                'style': 75  # Default validator style score
            }
            
        except SyntaxError as e:
            results['security_issues'].append({
                'type': 'syntax_error',
                'message': f'Syntax error detected by validator: {str(e)}',
                'line': getattr(e, 'lineno', 0),
                'severity': 'critical'
            })
            
        return results

    def _calculate_nesting_depth(self, node, current_depth=0):
        """Calculate maximum nesting depth of a node"""
        max_depth = current_depth
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.For, ast.While, ast.If, ast.With)):
                child_depth = self._calculate_nesting_depth(child, current_depth + 1)
                max_depth = max(max_depth, child_depth)
        return max_depth

    async def _validate_js_analysis(self, code: str) -> Dict[str, Any]:
        """Independent JavaScript analysis"""
        results = {
            'security_issues': [],
            'validator_scores': {'security': 75, 'performance': 75, 'maintainability': 75, 'style': 75}
        }
        
        # More comprehensive JS security checks
        dangerous_patterns = [
            ('eval(', 'dangerous_eval'),
            ('innerHTML', 'xss_risk'),
            ('document.write', 'document_write'),
            ('setTimeout(', 'string_timeout'),
            ('setInterval(', 'string_interval')
        ]
        
        for pattern, issue_type in dangerous_patterns:
            if pattern in code:
                results['security_issues'].append({
                    'type': issue_type,
                    'pattern': pattern,
                    'severity': 'high' if 'eval' in pattern else 'medium',
                    'validator_note': f'Validator detected {issue_type} pattern'
                })
        
        return results

    async def _validate_solidity_analysis(self, code: str) -> Dict[str, Any]:
        """Independent Solidity analysis"""
        results = {
            'security_issues': [],
            'validator_scores': {'security': 75, 'performance': 75, 'maintainability': 75, 'style': 75}
        }
        
        # Comprehensive Solidity security patterns
        solidity_issues = [
            ('tx.origin', 'tx_origin_vulnerability', 'critical'),
            ('.call(', 'low_level_call', 'high'),
            ('selfdestruct', 'selfdestruct_usage', 'high'),
            ('delegatecall', 'delegatecall_risk', 'high'),
            ('block.timestamp', 'timestamp_dependence', 'medium'),
            ('block.number', 'block_number_dependence', 'medium'),
            ('msg.value', 'ether_handling', 'medium')
        ]
        
        for pattern, issue_type, severity in solidity_issues:
            if pattern in code:
                results['security_issues'].append({
                    'type': issue_type,
                    'pattern': pattern,
                    'severity': severity,
                    'validator_note': f'Validator flagged {issue_type}'
                })
        
        return results

    async def _validate_generic_analysis(self, code: str) -> Dict[str, Any]:
        """Generic analysis for other languages"""
        return {
            'security_issues': [],
            'validator_scores': {'security': 70, 'performance': 70, 'maintainability': 70, 'style': 70}
        }

    async def _independent_ai_analysis(self, code: str, language: str) -> Optional[Dict[str, Any]]:
        """Perform independent AI analysis for validation using OpenAI"""
        if not self.openai_client:
            return self._fallback_validator_ai_analysis()

        prompt = self._create_validation_prompt(code, language)

        try:
            return await self._validate_with_openai(prompt)
        except Exception as e:
            print(f"⚠️  Validator AI analysis failed: {e}")
            return self._fallback_validator_ai_analysis()

    def _create_validation_prompt(self, code: str, language: str) -> str:
        """Create validation prompt for independent AI analysis"""
        return f"""
As a code review validator, please perform an independent analysis of this {language} code.
Your role is to verify the quality and completeness of code reviews by other agents.

Code to analyze:
```{language}
{code}
```

Please provide a thorough analysis focusing on:
1. Security vulnerabilities (be conservative in scoring)
2. Performance bottlenecks
3. Code maintainability issues
4. Style and best practice violations

Provide your analysis as JSON:
{{
    "validator_security_score": 85,
    "validator_performance_score": 78,
    "validator_maintainability_score": 90,
    "validator_style_score": 82,
    "critical_issues": [
        {{"type": "security", "description": "...", "severity": "critical"}},
        {{"type": "performance", "description": "...", "severity": "medium"}}
    ],
    "validator_recommendations": ["...", "..."],
    "methodology_notes": "Notes about the analysis approach used",
    "confidence_level": "high"
}}

Be more conservative than typical code review agents - err on the side of caution.
"""

    async def _validate_with_openai(self, prompt: str) -> Dict[str, Any]:
        """Validate using OpenAI"""
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a strict code review validator. Be conservative in your scoring."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return self._parse_validator_response_fallback(response.choices[0].message.content)

    def _fallback_validator_ai_analysis(self) -> Dict[str, Any]:
        """Fallback analysis when AI is not available"""
        return {
            "validator_security_score": 70,
            "validator_performance_score": 70,
            "validator_maintainability_score": 70,
            "validator_style_score": 70,
            "critical_issues": [
                {"type": "info", "description": "AI validation not available - using conservative static analysis", "severity": "info"}
            ],
            "validator_recommendations": ["Enable AI validation for more thorough analysis"],
            "methodology_notes": "Static analysis only - AI enhancement recommended",
            "confidence_level": "medium"
        }

    def _parse_validator_response_fallback(self, response_text: str) -> Dict[str, Any]:
        """Parse validator response when JSON fails"""
        return {
            "validator_security_score": 65,  # Conservative fallback
            "validator_performance_score": 65,
            "validator_maintainability_score": 65,
            "validator_style_score": 65,
            "critical_issues": [{"type": "info", "description": "Response parsing failed", "severity": "info"}],
            "validator_recommendations": ["Enable structured responses for better validation"],
            "methodology_notes": "Fallback analysis due to parsing issues",
            "confidence_level": "low"
        }

    async def _independent_security_analysis(self, code: str, language: str) -> Dict[str, Any]:
        """Specialized security analysis for validation"""
        # This would integrate with specialized security tools
        return {
            "security_tools_used": ["static_analysis", "pattern_matching"],
            "security_score": 75,
            "critical_vulnerabilities": [],
            "security_recommendations": ["Implement input validation", "Add error handling"]
        }

    async def _verify_analysis_methodology(self, original_response: Dict[str, Any]) -> Dict[str, Any]:
        """Verify the methodology used in the original analysis"""
        methodology_check = {
            "static_analysis_used": bool(original_response.get('analysis_details', {}).get('static_analysis')),
            "ai_analysis_used": bool(original_response.get('analysis_details', {}).get('ai_analysis')),
            "security_focus": len(original_response.get('issues', [])) > 0,
            "comprehensive_scoring": all(key in original_response for key in ['security_score', 'performance_score', 'maintainability_score', 'style_score']),
            "methodology_score": 85  # Default methodology score
        }
        
        # Calculate methodology score based on completeness
        score_factors = [
            methodology_check["static_analysis_used"],
            methodology_check["ai_analysis_used"],
            methodology_check["security_focus"],
            methodology_check["comprehensive_scoring"]
        ]
        
        methodology_check["methodology_score"] = int(sum(score_factors) * 25)
        
        return methodology_check

    async def _compare_analyses(self, original_response: Dict[str, Any], independent_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Compare original review with independent analysis"""
        
        discrepancies = []
        
        # Compare scores
        original_scores = {
            'security': original_response.get('security_score', 0),
            'performance': original_response.get('performance_score', 0),
            'maintainability': original_response.get('maintainability_score', 0),
            'style': original_response.get('style_score', 0)
        }
        
        validator_scores = independent_analysis.get('static_analysis', {}).get('validator_scores', {})
        ai_validator_scores = independent_analysis.get('ai_analysis', {})
        
        # Check for significant score differences
        for category in original_scores:
            original_score = original_scores[category]
            validator_static_score = validator_scores.get(category, 70)
            validator_ai_score = ai_validator_scores.get(f'validator_{category}_score', 70)
            
            avg_validator_score = (validator_static_score + validator_ai_score) / 2
            
            if abs(original_score - avg_validator_score) > 15:  # Significant difference threshold
                discrepancies.append({
                    'type': 'score_discrepancy',
                    'category': category,
                    'original_score': original_score,
                    'validator_score': int(avg_validator_score),
                    'difference': int(abs(original_score - avg_validator_score)),
                    'severity': 'high' if abs(original_score - avg_validator_score) > 25 else 'medium'
                })
        
        # Compare issue detection
        original_issues = len(original_response.get('issues', []))
        validator_issues = len(independent_analysis.get('static_analysis', {}).get('security_issues', []))
        
        if abs(original_issues - validator_issues) > 2:  # Significant difference in issue count
            discrepancies.append({
                'type': 'issue_count_discrepancy',
                'original_issues': original_issues,
                'validator_issues': validator_issues,
                'difference': abs(original_issues - validator_issues),
                'severity': 'medium'
            })
        
        return {
            'discrepancies': discrepancies,
            'score_comparison': {
                'original': original_scores,
                'validator': {category: int((validator_scores.get(category, 70) + 
                            ai_validator_scores.get(f'validator_{category}_score', 70)) / 2) 
                            for category in original_scores}
            },
            'consistency_score': max(0, 100 - len(discrepancies) * 10)  # Reduce score for each discrepancy
        }

    def _calculate_validation_scores(self, comparison_results: Dict[str, Any]) -> Dict[str, int]:
        """Calculate validation scores based on comparison results"""
        
        consistency_score = comparison_results['consistency_score']
        
        # Accuracy score based on how well scores align
        high_severity_discrepancies = len([d for d in comparison_results['discrepancies'] if d.get('severity') == 'high'])
        accuracy_score = max(0, 100 - high_severity_discrepancies * 20)
        
        # Completeness score based on methodology
        methodology_factors = 4  # static, ai, security, comprehensive
        completeness_score = 85  # Base score, would be calculated from methodology check
        
        # Methodology score
        methodology_score = 85  # Base score, would be calculated from detailed methodology analysis
        
        # Overall validation score
        overall_score = int((accuracy_score + completeness_score + methodology_score + consistency_score) / 4)
        
        return {
            'overall_score': overall_score,
            'accuracy_score': accuracy_score,
            'completeness_score': completeness_score,
            'methodology_score': methodology_score,
            'consistency_score': consistency_score
        }

    def _generate_recommendation(self, scores: Dict[str, int], comparison_results: Dict[str, Any]) -> str:
        """Generate validation recommendation"""
        overall_score = scores['overall_score']
        
        if overall_score >= 85:
            return "APPROVED: High-quality code review with accurate analysis and appropriate methodology."
        elif overall_score >= 70:
            return "APPROVED WITH NOTES: Good code review but some minor discrepancies noted. Consider the validator's feedback for improvement."
        elif overall_score >= 50:
            return "CONDITIONAL: Moderate quality code review with significant discrepancies. Recommend revisions before accepting."
        else:
            return "REJECTED: Significant issues with review accuracy or methodology. Major revisions required."

    async def _store_validation(self, validation_id: str, request: ValidationRequest, response: ValidationResponse):
        """Store validation data for audit trail"""
        validation_data = {
            'validation_id': validation_id,
            'validator_agent_id': self.agent_id,
            'timestamp': datetime.now().isoformat(),
            'request': request.model_dump(),
            'response': response.model_dump()
        }
        
        validation_path = self.validations_storage / f"{validation_id}.json"
        with open(validation_path, 'w') as f:
            json.dump(validation_data, f, indent=2)
        
        print(f"📁 Validation {validation_id} stored for audit trail")

    async def run_server(self, host: str = "0.0.0.0", port: int = 8081):
        """Run the validation service server"""
        import uvicorn
        
        print(f"🚀 Starting Code Review Validator Agent on {host}:{port}")
        print(f"🛡️  Agent ID: {self.agent_id}")
        print(f"🌐 Domain: {self.agent_domain}")
        print(f"📚 API Documentation: http://{host}:{port}/docs")
        
        uvicorn.run(self.app, host=host, port=port)

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Example usage  
    private_key = os.getenv('VALIDATOR_PRIVATE_KEY', os.getenv('PRIVATE_KEY'))
    if not private_key:
        print("❌ Error: VALIDATOR_PRIVATE_KEY or PRIVATE_KEY not set in environment variables")
        print("Please set VALIDATOR_PRIVATE_KEY in your .env file")
        sys.exit(1)
    
    agent = CodeReviewValidatorAgent(private_key)
    
    # Register with ERC-8004 if not already registered
    if not agent.agent_id:
        agent.register_agent()
    
    # Run the server
    asyncio.run(agent.run_server())
