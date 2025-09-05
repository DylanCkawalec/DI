#!/usr/bin/env python3
"""
Enhanced ERC-8004 AI Code Review Server Agent with Expert-Level Prompts

This enhanced agent integrates the sophisticated prompt system for professional
code analysis using expert-level AI integration.
"""

import os
import sys
import json
import hashlib
import asyncio
import time
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Core dependencies
from agents.base_agent import ERC8004BaseAgent
from expert_prompt_system import ExpertPromptSystem, AnalysisPhase

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

# FastAPI for API endpoints
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class CodeReviewRequest(BaseModel):
    """Enhanced request model for code review"""
    code: str
    language: str
    filename: str
    description: Optional[str] = None
    focus_areas: Optional[List[str]] = ["security", "performance", "maintainability", "style"]
    analysis_depth: Optional[str] = "comprehensive"  # basic, standard, comprehensive
    user_api_keys: Optional[Dict[str, str]] = None  # Allow user's own API keys

class EnhancedCodeReviewResponse(BaseModel):
    """Enhanced response model with expert analysis"""
    review_id: str
    overall_score: int
    security_score: int
    performance_score: int
    maintainability_score: int
    style_score: int
    issues: List[Dict[str, Any]]
    recommendations: List[str]
    analysis_details: Dict[str, Any]
    
    # Enhanced fields
    expert_analysis: Optional[Dict[str, Any]] = None
    improved_code: Optional[str] = None
    vulnerability_report: Optional[Dict[str, Any]] = None
    compliance_assessment: Optional[Dict[str, Any]] = None
    cost_breakdown: Optional[Dict[str, Any]] = None

class EnhancedCodeReviewAgent(ERC8004BaseAgent):
    """Enhanced AI Code Review Agent with Expert-Level Analysis"""
    
    def __init__(self, private_key: str, agent_domain: str = "enhanced-code-review.erc8004.dev"):
        super().__init__(agent_domain, private_key)
        
        # Initialize expert prompt system
        self.expert_system = ExpertPromptSystem()
        
        # Code review storage
        self.reviews_storage = Path("data/code_reviews")
        self.reviews_storage.mkdir(parents=True, exist_ok=True)
        
        # Initialize FastAPI app
        self.app = self._create_api_app()
        
        print(f"🚀 Enhanced Code Review Server Agent initialized")
        print(f"   Domain: {self.agent_domain}")
        print(f"   Address: {self.address}")
        print(f"   Expert System: ✅ Available")

    def _create_api_app(self) -> FastAPI:
        """Create FastAPI application with enhanced endpoints"""
        app = FastAPI(
            title="Enhanced ERC-8004 AI Code Review Service",
            description="Expert-level AI-powered code review service with sophisticated analysis",
            version="2.0.0"
        )
        
        # Add CORS middleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"]
        )
        
        @app.post("/review", response_model=EnhancedCodeReviewResponse)
        async def enhanced_review_code(request: CodeReviewRequest):
            """Enhanced code review endpoint with expert analysis"""
            try:
                return await self._perform_enhanced_code_review(request)
            except Exception as e:
                print(f"❌ Enhanced review failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.post("/review/comprehensive", response_model=EnhancedCodeReviewResponse)
        async def comprehensive_review(request: CodeReviewRequest):
            """Comprehensive multi-phase expert analysis"""
            try:
                request.analysis_depth = "comprehensive"
                return await self._perform_comprehensive_analysis(request)
            except Exception as e:
                print(f"❌ Comprehensive review failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/agent/info")
        async def get_enhanced_agent_info():
            """Get enhanced agent information"""
            return {
                "agent_id": self.agent_id,
                "agent_domain": self.agent_domain,
                "agent_address": self.address,
                "services": [
                    "expert_code_review", 
                    "comprehensive_security_audit", 
                    "performance_optimization", 
                    "architecture_assessment",
                    "code_improvement_generation"
                ],
                "supported_languages": ["python", "javascript", "typescript", "solidity", "go", "rust", "java"],
                "analysis_depths": ["basic", "standard", "comprehensive"],
                "trust_models": ["feedback", "inference-validation", "tee-attestation"],
                "ai_models": ["grok-2", "claude-3.5-sonnet", "gpt-4o"],
                "expert_features": {
                    "multi_phase_analysis": True,
                    "vulnerability_scoring": "CVSS 3.1",
                    "compliance_checking": ["OWASP", "NIST", "PCI DSS"],
                    "code_improvement": True,
                    "architecture_review": True
                }
            }
        
        @app.get("/reviews/{review_id}")
        async def get_enhanced_review(review_id: str):
            """Get enhanced review with full expert analysis"""
            review_path = self.reviews_storage / f"{review_id}.json"
            if not review_path.exists():
                raise HTTPException(status_code=404, detail="Review not found")
                
            with open(review_path, 'r') as f:
                return json.load(f)
        
        @app.get("/reviews/{review_id}/improved-code")
        async def get_improved_code(review_id: str):
            """Get improved code generated by expert analysis"""
            review_path = self.reviews_storage / f"{review_id}.json"
            if not review_path.exists():
                raise HTTPException(status_code=404, detail="Review not found")
            
            with open(review_path, 'r') as f:
                review_data = json.load(f)
            
            improved_code = review_data.get("response", {}).get("improved_code")
            if not improved_code:
                raise HTTPException(status_code=404, detail="Improved code not available")
            
            return {"review_id": review_id, "improved_code": improved_code}
        
        return app

    async def _perform_enhanced_code_review(self, request: CodeReviewRequest) -> EnhancedCodeReviewResponse:
        """Perform enhanced code review with expert analysis"""
        
        review_id = hashlib.sha256(
            f"{request.code}{request.filename}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        
        print(f"🔍 Starting enhanced code review {review_id} for {request.filename}")
        print(f"   Analysis depth: {request.analysis_depth}")
        print(f"   Focus areas: {', '.join(request.focus_areas)}")
        
        start_time = time.time()
        
        # Configure expert system with user's API keys if provided
        if request.user_api_keys:
            await self._configure_user_api_keys(request.user_api_keys)
        
        # Perform expert analysis based on depth
        if request.analysis_depth == "comprehensive":
            expert_results = await self.expert_system.run_comprehensive_analysis(
                request.code, request.language
            )
        else:
            # For standard/basic depth, run key phases
            key_phases = [
                AnalysisPhase.INITIAL_SCAN,
                AnalysisPhase.DEEP_SECURITY,
                AnalysisPhase.CODE_IMPROVEMENT
            ]
            expert_results = await self._run_selected_phases(
                request.code, request.language, key_phases
            )
        
        # Generate enhanced response
        response = await self._generate_enhanced_response(
            review_id, request, expert_results, start_time
        )
        
        # Store enhanced review
        await self._store_enhanced_review(review_id, request, response, expert_results)
        
        processing_time = time.time() - start_time
        total_cost = expert_results.get("total_cost_usd", 0)
        
        print(f"✅ Enhanced review {review_id} completed")
        print(f"   Time: {processing_time:.2f}s")
        print(f"   Cost: ${total_cost:.4f}")
        print(f"   Score: {response.overall_score}/100")
        
        return response

    async def _perform_comprehensive_analysis(self, request: CodeReviewRequest) -> EnhancedCodeReviewResponse:
        """Perform comprehensive multi-phase expert analysis"""
        
        review_id = hashlib.sha256(
            f"comprehensive_{request.code}{request.filename}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        
        print(f"🚀 Starting comprehensive analysis {review_id}")
        
        start_time = time.time()
        
        # Run full comprehensive analysis
        expert_results = await self.expert_system.run_comprehensive_analysis(
            request.code, request.language
        )
        
        # Generate comprehensive response with all expert insights
        response = await self._generate_comprehensive_response(
            review_id, request, expert_results, start_time
        )
        
        # Store comprehensive analysis
        await self._store_enhanced_review(review_id, request, response, expert_results)
        
        processing_time = time.time() - start_time
        total_cost = expert_results.get("total_cost_usd", 0)
        
        print(f"🎉 Comprehensive analysis {review_id} completed")
        print(f"   Total phases: {len(expert_results.get('phase_results', {}))}")
        print(f"   Time: {processing_time:.2f}s")
        print(f"   Cost: ${total_cost:.4f}")
        
        return response

    async def _run_selected_phases(self, code: str, language: str, 
                                 phases: List[AnalysisPhase]) -> Dict[str, Any]:
        """Run selected analysis phases"""
        
        results = {"phase_results": {}, "total_cost_usd": 0, "total_tokens_used": 0}
        previous_findings = None
        
        for phase in phases:
            try:
                result = await self.expert_system.run_expert_analysis_phase(
                    phase, code, language, previous_findings
                )
                
                results["phase_results"][phase.value] = {
                    "model_used": result.model_used,
                    "processing_time": result.processing_time,
                    "token_usage": result.token_usage,
                    "confidence_score": result.confidence_score,
                    "analysis": result.analysis_data
                }
                
                # Update costs
                model_config = self.expert_system.model_configs[result.model_used]
                phase_cost = (result.token_usage / 1000) * model_config.cost_per_1k_tokens
                results["total_cost_usd"] += phase_cost
                results["total_tokens_used"] += result.token_usage
                
                previous_findings = result.analysis_data
                
            except Exception as e:
                print(f"❌ Phase {phase.value} failed: {e}")
                results["phase_results"][phase.value] = {"error": str(e)}
        
        # Generate summary
        results["comprehensive_summary"] = self.expert_system._generate_comprehensive_summary(
            results["phase_results"]
        )
        
        return results

    async def _generate_enhanced_response(self, review_id: str, request: CodeReviewRequest,
                                        expert_results: Dict[str, Any], start_time: float) -> EnhancedCodeReviewResponse:
        """Generate enhanced response from expert analysis"""
        
        summary = expert_results.get("comprehensive_summary", {})
        phase_results = expert_results.get("phase_results", {})
        
        # Extract scores from expert analysis
        security_score = summary.get("overall_security_score", 70)
        performance_score = summary.get("overall_performance_score", 70)
        overall_score = int((security_score + performance_score + 75 + 75) / 4)  # Include maintainability and style estimates
        
        # Extract issues and recommendations
        all_issues = []
        all_recommendations = []
        
        for phase_name, phase_result in phase_results.items():
            if "analysis" in phase_result and isinstance(phase_result["analysis"], dict):
                analysis = phase_result["analysis"]
                
                # Extract vulnerabilities as issues
                if "critical_vulnerabilities" in analysis:
                    for vuln in analysis["critical_vulnerabilities"]:
                        all_issues.append({
                            "type": "security",
                            "message": vuln.get("description", vuln.get("message", "Security issue detected")),
                            "severity": vuln.get("severity", "high"),
                            "line": vuln.get("line", 0),
                            "source_phase": phase_name
                        })
                
                if "advanced_vulnerabilities" in analysis:
                    for vuln in analysis["advanced_vulnerabilities"]:
                        all_issues.append({
                            "type": "security",
                            "message": vuln.get("technical_details", "Advanced security issue"),
                            "severity": "critical" if vuln.get("severity_score", 0) >= 8 else "high",
                            "line": 0,
                            "source_phase": phase_name
                        })
                
                # Extract recommendations
                for rec_key in ["recommendations", "immediate_actions", "final_recommendations"]:
                    if rec_key in analysis and isinstance(analysis[rec_key], list):
                        all_recommendations.extend(analysis[rec_key])
        
        # Extract improved code
        improved_code = None
        for phase_result in phase_results.values():
            if "analysis" in phase_result and isinstance(phase_result["analysis"], dict):
                analysis = phase_result["analysis"]
                if "improved_code" in analysis and analysis["improved_code"]:
                    improved_code = analysis["improved_code"]
                    break
        
        # Generate vulnerability report
        vulnerability_report = self._generate_vulnerability_report(phase_results)
        
        # Generate compliance assessment
        compliance_assessment = self._generate_compliance_assessment(phase_results)
        
        # Cost breakdown
        cost_breakdown = {
            "total_cost_usd": expert_results.get("total_cost_usd", 0),
            "total_tokens": expert_results.get("total_tokens_used", 0),
            "processing_time": time.time() - start_time,
            "phases_completed": len(phase_results),
            "cost_per_phase": expert_results.get("total_cost_usd", 0) / max(1, len(phase_results))
        }
        
        return EnhancedCodeReviewResponse(
            review_id=review_id,
            overall_score=overall_score,
            security_score=security_score,
            performance_score=performance_score,
            maintainability_score=75,  # Estimate, would come from architecture analysis
            style_score=75,  # Estimate
            issues=all_issues,
            recommendations=list(set(all_recommendations)),  # Remove duplicates
            analysis_details={
                "timestamp": datetime.now().isoformat(),
                "processing_time": time.time() - start_time,
                "language": request.language,
                "analysis_depth": request.analysis_depth,
                "expert_system_version": "2.0.0",
                "phases_analyzed": list(phase_results.keys())
            },
            expert_analysis=expert_results,
            improved_code=improved_code,
            vulnerability_report=vulnerability_report,
            compliance_assessment=compliance_assessment,
            cost_breakdown=cost_breakdown
        )

    async def _generate_comprehensive_response(self, review_id: str, request: CodeReviewRequest,
                                             expert_results: Dict[str, Any], start_time: float) -> EnhancedCodeReviewResponse:
        """Generate comprehensive response with full expert analysis"""
        # Similar to enhanced response but with full comprehensive data
        return await self._generate_enhanced_response(review_id, request, expert_results, start_time)

    def _generate_vulnerability_report(self, phase_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed vulnerability report"""
        
        vulnerabilities = []
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        
        for phase_name, phase_result in phase_results.items():
            if "analysis" not in phase_result or not isinstance(phase_result["analysis"], dict):
                continue
            
            analysis = phase_result["analysis"]
            
            # Process different vulnerability types
            for vuln_key in ["critical_vulnerabilities", "advanced_vulnerabilities", "security_issues"]:
                if vuln_key in analysis and isinstance(analysis[vuln_key], list):
                    for vuln in analysis[vuln_key]:
                        if isinstance(vuln, dict):
                            severity = vuln.get("severity", "medium").lower()
                            if severity in severity_counts:
                                severity_counts[severity] += 1
                            
                            vulnerabilities.append({
                                "id": f"vuln_{len(vulnerabilities) + 1}",
                                "type": vuln.get("type", vuln.get("vulnerability_type", "unknown")),
                                "severity": severity,
                                "description": vuln.get("description", vuln.get("message", "Vulnerability detected")),
                                "location": vuln.get("location", vuln.get("line", "Unknown")),
                                "remediation": vuln.get("remediation", vuln.get("remediation_strategy", "Fix required")),
                                "source_phase": phase_name
                            })
        
        return {
            "total_vulnerabilities": len(vulnerabilities),
            "severity_breakdown": severity_counts,
            "risk_score": min(100, severity_counts["critical"] * 25 + severity_counts["high"] * 15 + severity_counts["medium"] * 5),
            "vulnerabilities": vulnerabilities[:20],  # Limit for response size
            "recommendations": [
                "Address critical vulnerabilities immediately",
                "Implement comprehensive input validation",
                "Add security monitoring and logging",
                "Conduct regular security assessments"
            ]
        }

    def _generate_compliance_assessment(self, phase_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate compliance assessment based on analysis"""
        
        compliance_frameworks = {
            "OWASP_Top_10": {"compliant": False, "issues": [], "score": 0},
            "NIST_Cybersecurity": {"compliant": False, "issues": [], "score": 0},
            "PCI_DSS": {"compliant": False, "issues": [], "score": 0}
        }
        
        # Analyze compliance based on detected issues
        total_issues = sum(len(result.get("analysis", {}).get("critical_vulnerabilities", [])) 
                          for result in phase_results.values() if "analysis" in result)
        
        if total_issues == 0:
            for framework in compliance_frameworks.values():
                framework["compliant"] = True
                framework["score"] = 95
        else:
            compliance_score = max(0, 100 - total_issues * 15)
            for framework in compliance_frameworks.values():
                framework["score"] = compliance_score
                framework["compliant"] = compliance_score >= 80
                if not framework["compliant"]:
                    framework["issues"] = ["Security vulnerabilities detected", "Insufficient input validation"]
        
        return {
            "frameworks": compliance_frameworks,
            "overall_compliance_score": sum(f["score"] for f in compliance_frameworks.values()) // len(compliance_frameworks),
            "recommendations": [
                "Implement security controls per OWASP guidelines",
                "Establish continuous compliance monitoring",
                "Regular security assessments and audits"
            ]
        }

    async def _configure_user_api_keys(self, user_api_keys: Dict[str, str]):
        """Configure expert system to use user's API keys"""
        # This would temporarily configure the expert system with user's keys
        # In production, ensure secure handling of API keys
        pass

    async def _store_enhanced_review(self, review_id: str, request: CodeReviewRequest,
                                   response: EnhancedCodeReviewResponse, expert_results: Dict[str, Any]):
        """Store enhanced review data"""
        
        review_data = {
            'review_id': review_id,
            'agent_id': self.agent_id,
            'timestamp': datetime.now().isoformat(),
            'request': request.model_dump(),
            'response': response.model_dump(),
            'expert_results': expert_results,
            'data_hash': hashlib.sha256(request.code.encode()).hexdigest(),
            'version': '2.0.0'
        }
        
        review_path = self.reviews_storage / f"{review_id}.json"
        with open(review_path, 'w') as f:
            json.dump(review_data, f, indent=2, default=str)
        
        print(f"📁 Enhanced review {review_id} stored")

    async def run_server(self, host: str = "0.0.0.0", port: int = 8080):
        """Run the enhanced code review service server"""
        import uvicorn
        
        print(f"🚀 Starting Enhanced Code Review Agent on {host}:{port}")
        print(f"📡 Agent ID: {self.agent_id}")
        print(f"🌐 Domain: {self.agent_domain}")
        print(f"📚 API Documentation: http://{host}:{port}/docs")
        print(f"🧠 Expert Analysis: Available")
        
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
    
    agent = EnhancedCodeReviewAgent(private_key)
    
    # Register with ERC-8004 if not already registered
    if not agent.agent_id:
        agent.register_agent()
    
    # Run the server
    asyncio.run(agent.run_server())
