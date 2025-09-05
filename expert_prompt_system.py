#!/usr/bin/env python3
"""
Expert-Level AI Prompt System for ERC-8004 Code Analysis

This module demonstrates sophisticated prompt engineering for professional
code review using Grok, Claude, and GPT models at expert level.
"""

import os
import sys
import json
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# AI Client imports
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

try:
    from xai_sdk import Client as XAIClient
    from xai_sdk.chat import user as xai_user, system as xai_system
    XAI_AVAILABLE = True
except ImportError:
    XAI_AVAILABLE = False

try:
    import httpx
    GROK_FALLBACK_AVAILABLE = True
except ImportError:
    GROK_FALLBACK_AVAILABLE = False

class AnalysisPhase(Enum):
    """Analysis phases for multi-step workflow"""
    INITIAL_SCAN = "initial_scan"
    DEEP_SECURITY = "deep_security"
    PERFORMANCE_ANALYSIS = "performance_analysis"
    ARCHITECTURE_REVIEW = "architecture_review"
    CODE_IMPROVEMENT = "code_improvement"
    FINAL_VALIDATION = "final_validation"

@dataclass
class AIModelConfig:
    """Configuration for AI models"""
    model_name: str
    max_tokens: int
    temperature: float
    use_for_phases: List[AnalysisPhase]
    cost_per_1k_tokens: float

@dataclass
class ExpertAnalysisResult:
    """Comprehensive analysis result"""
    phase: AnalysisPhase
    model_used: str
    analysis_data: Dict[str, Any]
    processing_time: float
    token_usage: int
    confidence_score: int

class ExpertPromptSystem:
    """Expert-level prompt engineering system for code analysis"""
    
    def __init__(self):
        """Initialize the expert prompt system"""
        self.grok_client = None
        self.claude_client = None
        self.openai_client = None
        
        # Initialize AI clients
        self._init_ai_clients()
        
        # Model configurations (curated for 2025-09)
        self.model_configs = {
            # Fast triage / initial scan
            "grok-fast": AIModelConfig(
                model_name=os.getenv("GROK_FAST_MODEL", "grok-3-mini"),
                max_tokens=2000,
                temperature=0.1,
                use_for_phases=[AnalysisPhase.INITIAL_SCAN],
                cost_per_1k_tokens=0.001  # Most cost-effective
            ),
            # Standard Grok for code work / perf
            "grok-standard": AIModelConfig(
                model_name=os.getenv("GROK_STANDARD_MODEL", "grok-3"),
                max_tokens=4000,
                temperature=0.15,
                use_for_phases=[AnalysisPhase.CODE_IMPROVEMENT, AnalysisPhase.PERFORMANCE_ANALYSIS],
                cost_per_1k_tokens=0.002  # Cost-effective
            ),
            # Claude for deep/security/arch/final
            "claude": AIModelConfig(
                # Anthropic recommends Sonnet 4; 3.5 Sonnet is being retired
                model_name=os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=8000,
                temperature=0.2,
                use_for_phases=[
                    AnalysisPhase.DEEP_SECURITY,
                    AnalysisPhase.ARCHITECTURE_REVIEW,
                    AnalysisPhase.FINAL_VALIDATION,
                ],
                cost_per_1k_tokens=0.015  # Premium quality
            ),
        }
        
        print("🧠 Expert AI Prompt System initialized")
        print(f"   xAI (Grok): {'✅' if self.xai_client else '❌'}")
        print(f"   Anthropic (Claude): {'✅' if self.claude_client else '❌'}")
        print(f"   OpenAI fallback: {'✅' if self.openai_client else '⚪ optional'}")

    def _init_ai_clients(self):
        """Initialize AI clients with API keys"""
        
        # Initialize XAI SDK for Grok models (using GROK_API_KEY)
        if XAI_AVAILABLE and (os.getenv('GROK_API_KEY') or os.getenv('XAI_API_KEY')):
            try:
                api_key = os.getenv('GROK_API_KEY') or os.getenv('XAI_API_KEY')
                self.xai_client = XAIClient(api_key=api_key)
                print("✅ xAI SDK initialized (Grok)")
            except Exception as e:
                print(f"⚠️ xAI SDK initialization failed: {e}")
                self.xai_client = None
        else:
            self.xai_client = None
            
        # Initialize Claude client
        if ANTHROPIC_AVAILABLE and os.getenv('ANTHROPIC_API_KEY'):
            try:
                self.claude_client = anthropic.Anthropic(
                    api_key=os.getenv('ANTHROPIC_API_KEY')
                )
                print("✅ Claude client initialized")
            except Exception as e:
                print(f"⚠️ Claude initialization failed: {e}")
                self.claude_client = None
        else:
            self.claude_client = None
            
        # Keep OpenAI as fallback but don't use GPT-4
        if OPENAI_AVAILABLE and os.getenv('OPENAI_API_KEY'):
            try:
                self.openai_client = openai.OpenAI(
                    api_key=os.getenv('OPENAI_API_KEY')
                )
                print("✅ OpenAI client available as fallback")
            except Exception as e:
                print(f"⚠️ OpenAI initialization failed: {e}")
                self.openai_client = None
        else:
            self.openai_client = None

    def create_expert_system_prompt(self, phase: AnalysisPhase) -> str:
        """Create sophisticated system prompts for each analysis phase"""
        
        base_expertise = """You are a world-class cybersecurity expert and senior software architect with 20+ years of experience in:
- Advanced penetration testing and vulnerability assessment
- Enterprise software architecture and design patterns
- Performance optimization and scalability engineering
- Code security auditing for Fortune 500 companies
- OWASP Top 10 and advanced attack vectors
- Secure coding standards (SANS, NIST, ISO 27001)

Your analysis must be thorough, actionable, and demonstrate deep technical expertise."""

        phase_specific = {
            AnalysisPhase.INITIAL_SCAN: """
**PHASE: INITIAL SECURITY SCAN**

Your role: Lead Security Auditor performing initial threat assessment.

Focus on identifying:
1. CRITICAL vulnerabilities (RCE, SQL injection, XSS, CSRF)
2. Authentication and authorization flaws
3. Input validation weaknesses
4. Cryptographic failures
5. Insecure configurations

Provide CONCRETE examples of exploitation and business impact.
Rate severity using CVSS 3.1 methodology.
""",
            
            AnalysisPhase.DEEP_SECURITY: """
**PHASE: DEEP SECURITY ANALYSIS**

Your role: Principal Security Architect conducting comprehensive security review.

Perform advanced analysis:
1. Control flow analysis for logic flaws
2. Data flow tracking for injection vulnerabilities
3. Race condition and concurrency vulnerabilities
4. Business logic flaws and privilege escalation
5. Supply chain and dependency vulnerabilities
6. Timing attacks and side-channel vulnerabilities

Apply advanced security frameworks (STRIDE, DREAD, Attack Trees).
Consider sophisticated attack scenarios including APT tactics.
""",
            
            AnalysisPhase.PERFORMANCE_ANALYSIS: """
**PHASE: PERFORMANCE & SCALABILITY ANALYSIS**

Your role: Senior Performance Engineer and Scalability Architect.

Analyze computational complexity:
1. Algorithmic efficiency (Big O analysis)
2. Memory usage patterns and leak detection
3. I/O operations and database interaction patterns
4. Concurrency and threading issues
5. Resource contention and bottlenecks
6. Caching strategies and optimization opportunities

Provide specific recommendations with quantified performance improvements.
Consider production-scale load scenarios (10K+ concurrent users).
""",
            
            AnalysisPhase.ARCHITECTURE_REVIEW: """
**PHASE: ARCHITECTURE & DESIGN REVIEW**

Your role: Chief Technology Architect evaluating system design.

Evaluate architectural concerns:
1. Separation of concerns and modularity
2. Design patterns and anti-patterns
3. Dependency management and coupling
4. Error handling and resilience patterns
5. Maintainability and extensibility
6. Technical debt and refactoring opportunities

Apply enterprise architecture principles (SOLID, DDD, Microservices patterns).
Consider long-term maintainability and team scalability.
""",
            
            AnalysisPhase.CODE_IMPROVEMENT: """
**PHASE: CODE IMPROVEMENT & REMEDIATION**

Your role: Senior Developer Lead providing specific code improvements.

Generate production-ready improved code:
1. Fix ALL identified security vulnerabilities
2. Implement proper error handling and logging
3. Apply security best practices (input validation, output encoding)
4. Optimize performance bottlenecks
5. Improve code structure and readability
6. Add comprehensive documentation

Provide WORKING code that can be deployed to production.
Include unit tests and security verification steps.
""",
            
            AnalysisPhase.FINAL_VALIDATION: """
**PHASE: FINAL VALIDATION & COMPLIANCE**

Your role: Quality Assurance Director performing final review.

Validate analysis quality:
1. Verify all critical issues are identified
2. Confirm remediation effectiveness
3. Assess compliance with security standards (OWASP, SANS)
4. Review methodology and completeness
5. Validate risk scoring accuracy
6. Ensure actionable recommendations

Apply quality gates used in enterprise security programs.
Consider audit and compliance requirements.
"""
        }
        
        return f"{base_expertise}\n\n{phase_specific[phase]}"

    def create_analysis_prompt(self, phase: AnalysisPhase, code: str, language: str, 
                             previous_findings: Optional[Dict] = None) -> str:
        """Create sophisticated analysis prompts for each phase"""
        
        context_section = ""
        if previous_findings:
            context_section = f"""
**CONTEXT FROM PREVIOUS ANALYSIS:**
{json.dumps(previous_findings, indent=2)}

Build upon these findings and provide deeper analysis.
"""

        prompts = {
            AnalysisPhase.INITIAL_SCAN: f"""
{context_section}

**TARGET CODE ANALYSIS:**
Language: {language}
```{language}
{code}
```

**ANALYSIS REQUIREMENTS:**

Perform initial security triage focusing on:

1. **Critical Vulnerabilities** (Score each 0-100):
   - Remote Code Execution (RCE) vectors
   - SQL/NoSQL/LDAP injection points
   - Cross-Site Scripting (XSS) vulnerabilities
   - Authentication bypass opportunities
   - Authorization flaws and privilege escalation

2. **Security Configuration Issues**:
   - Hardcoded secrets, passwords, API keys
   - Insecure communication (HTTP vs HTTPS)
   - Dangerous function usage (eval, exec, system calls)
   - File system access without validation
   - Unsafe serialization/deserialization

3. **Business Logic Flaws**:
   - Race conditions in critical operations
   - Input validation bypass opportunities
   - Session management weaknesses
   - Error handling information disclosure

**RESPONSE FORMAT (JSON):**
```json
{{
  "critical_vulnerabilities": [
    {{
      "type": "specific_vulnerability_type",
      "severity": "critical|high|medium|low",
      "cvss_score": 9.8,
      "location": "function_name:line_number",
      "description": "Detailed technical description",
      "exploitation_scenario": "Step-by-step attack scenario",
      "business_impact": "Specific business consequences",
      "remediation": "Specific fix recommendation"
    }}
  ],
  "security_score": 25,
  "confidence_level": 95,
  "attack_surface_analysis": "Overall attack surface assessment",
  "immediate_actions": ["Prioritized remediation steps"]
}}
```

Be SPECIFIC with line numbers, function names, and exact vulnerability details.
""",

            AnalysisPhase.DEEP_SECURITY: f"""
{context_section}

**DEEP SECURITY ANALYSIS:**
Language: {language}
```{language}
{code}
```

**ADVANCED SECURITY ASSESSMENT:**

1. **Control Flow Analysis**:
   - Logic bombs and backdoors
   - State machine vulnerabilities
   - Workflow bypass opportunities
   - Conditional logic flaws

2. **Data Flow Security**:
   - Taint analysis for injection vulnerabilities
   - Data validation at trust boundaries
   - Information leakage patterns
   - Cryptographic key management

3. **Advanced Attack Vectors**:
   - Deserialization attacks
   - Server-Side Request Forgery (SSRF)
   - XML External Entity (XXE) attacks
   - Template injection vulnerabilities
   - Time-based attacks and timing side channels

4. **Concurrency Security**:
   - Race conditions in shared resources
   - Atomic operation failures
   - Deadlock and livelock vulnerabilities
   - Thread safety issues

5. **Supply Chain Security**:
   - Dependency vulnerabilities
   - Third-party library risks
   - Package integrity verification

**RESPONSE FORMAT (JSON):**
```json
{{
  "advanced_vulnerabilities": [
    {{
      "category": "control_flow|data_flow|concurrency|supply_chain",
      "vulnerability_type": "specific_type",
      "severity_score": 8.5,
      "technical_details": "Deep technical analysis",
      "attack_complexity": "low|medium|high",
      "exploit_code_sample": "Proof of concept exploit",
      "detection_evasion": "How attackers might evade detection",
      "remediation_strategy": "Comprehensive fix approach"
    }}
  ],
  "security_architecture_issues": "Systemic security design flaws",
  "threat_modeling_recommendations": "STRIDE-based recommendations",
  "security_controls_needed": ["Required security controls"],
  "compliance_gaps": "Gaps against security standards"
}}
```
""",

            AnalysisPhase.PERFORMANCE_ANALYSIS: f"""
{context_section}

**PERFORMANCE & SCALABILITY ANALYSIS:**
Language: {language}
```{language}
{code}
```

**COMPREHENSIVE PERFORMANCE EVALUATION:**

1. **Algorithmic Complexity Analysis**:
   - Time complexity (Big O notation) for each function
   - Space complexity and memory usage patterns
   - Recursive function analysis and optimization
   - Loop efficiency and nested iteration issues

2. **Resource Utilization**:
   - Memory allocation patterns and leaks
   - CPU-intensive operations identification
   - I/O operation efficiency (file, network, database)
   - Connection pooling and resource management

3. **Scalability Assessment**:
   - Concurrent request handling capability
   - Database query optimization opportunities
   - Caching strategies and implementation
   - Load balancing and horizontal scaling readiness

4. **Performance Bottlenecks**:
   - Synchronous operations that should be async
   - Inefficient data structures usage
   - String concatenation in loops
   - Unnecessary data copying and transformation

5. **Production Performance Concerns**:
   - Memory growth patterns over time
   - Response time under load
   - Throughput limitations
   - Resource cleanup and garbage collection

**RESPONSE FORMAT (JSON):**
```json
{{
  "performance_issues": [
    {{
      "category": "algorithmic|memory|io|concurrency",
      "issue_type": "specific_performance_issue",
      "severity": "critical|high|medium|low",
      "location": "function:line",
      "current_complexity": "O(n^2)",
      "optimized_complexity": "O(n log n)",
      "performance_impact": "Quantified impact (ms, MB, etc)",
      "load_testing_concern": "Impact under 1000+ concurrent users",
      "optimization_approach": "Specific optimization technique",
      "code_example": "Optimized code snippet"
    }}
  ],
  "performance_score": 45,
  "scalability_rating": 3,
  "memory_efficiency_score": 60,
  "critical_optimizations": ["Top 5 optimization priorities"],
  "production_recommendations": "Production deployment considerations"
}}
```
""",

            AnalysisPhase.ARCHITECTURE_REVIEW: f"""
{context_section}

**ARCHITECTURE & DESIGN REVIEW:**
Language: {language}
```{language}
{code}
```

**ENTERPRISE ARCHITECTURE ASSESSMENT:**

1. **Design Patterns & Anti-patterns**:
   - SOLID principles adherence
   - Design patterns usage (Factory, Observer, Strategy, etc)
   - Anti-patterns identification (God Object, Spaghetti Code)
   - Separation of concerns evaluation

2. **Code Structure & Organization**:
   - Module cohesion and coupling analysis
   - Dependency injection and inversion of control
   - Interface design and abstraction levels
   - Package/namespace organization

3. **Error Handling & Resilience**:
   - Exception handling strategy consistency
   - Circuit breaker and retry patterns
   - Graceful degradation capabilities
   - Monitoring and observability readiness

4. **Maintainability Assessment**:
   - Code readability and documentation
   - Technical debt quantification
   - Refactoring opportunities and priorities
   - Team collaboration considerations

5. **Extensibility & Future-proofing**:
   - Plugin architecture opportunities
   - Configuration management approach
   - API design and versioning strategy
   - Migration and backward compatibility

**RESPONSE FORMAT (JSON):**
```json
{{
  "architecture_issues": [
    {{
      "category": "design_patterns|structure|error_handling|maintainability",
      "issue_type": "specific_architectural_issue",
      "severity": "critical|high|medium|low",
      "technical_debt_score": 7,
      "refactoring_complexity": "low|medium|high",
      "recommended_pattern": "Design pattern or architectural approach",
      "implementation_approach": "Step-by-step refactoring plan",
      "team_impact": "Impact on development team productivity"
    }}
  ],
  "maintainability_score": 65,
  "extensibility_rating": 4,
  "technical_debt_hours": 120,
  "architecture_recommendations": ["Strategic architectural improvements"],
  "migration_strategy": "Approach for architectural improvements"
}}
```
""",

            AnalysisPhase.CODE_IMPROVEMENT: f"""
{context_section}

**CODE IMPROVEMENT & REMEDIATION:**
Language: {language}

**ORIGINAL CODE:**
```{language}
{code}
```

**COMPREHENSIVE CODE IMPROVEMENT:**

Generate production-ready improved code that addresses ALL identified issues:

1. **Security Hardening**:
   - Fix ALL security vulnerabilities
   - Implement proper input validation and sanitization
   - Add authentication and authorization checks
   - Secure cryptographic operations
   - Remove hardcoded secrets and credentials

2. **Performance Optimization**:
   - Optimize algorithmic complexity
   - Implement efficient data structures
   - Add caching where appropriate
   - Optimize database queries and I/O operations
   - Fix memory leaks and resource management

3. **Code Quality Enhancement**:
   - Apply consistent coding standards
   - Add comprehensive error handling
   - Implement proper logging and monitoring
   - Add unit tests and documentation
   - Refactor for maintainability

4. **Architecture Improvement**:
   - Apply appropriate design patterns
   - Improve separation of concerns
   - Add proper abstraction layers
   - Implement configuration management

**RESPONSE FORMAT (JSON):**
```json
{{
  "improved_code": "Complete improved code with all fixes applied",
  "security_improvements": [
    {{
      "vulnerability_fixed": "Specific vulnerability addressed",
      "fix_description": "What was changed and why",
      "security_impact": "Security improvement achieved",
      "verification_steps": "How to verify the fix works"
    }}
  ],
  "performance_improvements": [
    {{
      "optimization_applied": "Specific performance improvement",
      "before_after_metrics": "Performance comparison",
      "implementation_notes": "Technical implementation details"
    }}
  ],
  "code_quality_improvements": [
    {{
      "improvement_type": "Documentation|Testing|Structure|Standards",
      "description": "Specific improvement made",
      "maintainability_impact": "How this improves maintainability"
    }}
  ],
  "deployment_instructions": "Step-by-step production deployment guide",
  "testing_requirements": "Required testing before production deployment",
  "monitoring_recommendations": "Production monitoring and alerting setup"
}}
```

**REQUIREMENTS:**
- Code must be production-ready and deployable
- All security vulnerabilities must be fixed
- Performance must be optimized for enterprise scale
- Code must follow industry best practices
- Include comprehensive error handling and logging
""",

            AnalysisPhase.FINAL_VALIDATION: f"""
{context_section}

**FINAL VALIDATION & QUALITY ASSURANCE:**
Language: {language}

**VALIDATION CRITERIA:**

1. **Completeness Verification**:
   - All critical vulnerabilities identified and assessed
   - Performance issues comprehensively analyzed
   - Architectural concerns properly evaluated
   - Code improvements are production-ready

2. **Methodology Validation**:
   - Analysis follows industry best practices
   - Risk scoring is accurate and consistent
   - Recommendations are actionable and specific
   - Compliance with security standards verified

3. **Quality Assurance**:
   - Technical accuracy of findings
   - Completeness of remediation recommendations
   - Feasibility of implementation approaches
   - Business impact assessment accuracy

**RESPONSE FORMAT (JSON):**
```json
{{
  "validation_summary": {{
    "overall_quality_score": 92,
    "completeness_rating": "excellent|good|satisfactory|needs_improvement",
    "methodology_adherence": "Standards and frameworks properly applied",
    "technical_accuracy": "Assessment of technical findings accuracy"
  }},
  "critical_findings_summary": [
    {{
      "finding_type": "security|performance|architecture",
      "severity": "critical|high|medium|low",
      "validated": true,
      "remediation_priority": 1,
      "business_justification": "Why this should be prioritized"
    }}
  ],
  "compliance_assessment": {{
    "owasp_top10_coverage": "Coverage of OWASP Top 10 assessment",
    "security_standards_compliance": "NIST, ISO 27001, etc compliance",
    "industry_best_practices": "Adherence to industry best practices"
  }},
  "final_recommendations": [
    "Prioritized list of actionable recommendations"
  ],
  "deployment_readiness": {{
    "security_readiness": "Ready|Needs_fixes|Critical_issues",
    "performance_readiness": "Ready|Optimization_recommended|Critical_issues",
    "maintainability_readiness": "Ready|Improvements_needed|Refactoring_required"
  }}
}}
```
"""
        }
        
        return prompts.get(phase, "")

    async def run_expert_analysis_phase(self, phase: AnalysisPhase, code: str, 
                                       language: str, previous_findings: Optional[Dict] = None) -> ExpertAnalysisResult:
        """Run a single analysis phase with appropriate AI model"""
        
        start_time = time.time()
        
        # Select best model for this phase
        model_name = self._select_optimal_model(phase)
        
        if not model_name:
            raise Exception(f"No AI model available for phase {phase}")
        
        # Create expert prompts
        system_prompt = self.create_expert_system_prompt(phase)
        analysis_prompt = self.create_analysis_prompt(phase, code, language, previous_findings)
        
        # Run analysis with selected model
        analysis_data, token_usage = await self._execute_ai_analysis(
            model_name, system_prompt, analysis_prompt, phase
        )
        
        processing_time = time.time() - start_time
        
        # Calculate confidence score based on model and analysis quality
        confidence_score = self._calculate_confidence_score(model_name, analysis_data, phase)
        
        return ExpertAnalysisResult(
            phase=phase,
            model_used=model_name,
            analysis_data=analysis_data,
            processing_time=processing_time,
            token_usage=token_usage,
            confidence_score=confidence_score
        )

    def _select_optimal_model(self, phase: AnalysisPhase) -> Optional[str]:
        """Select the optimal AI model for a given analysis phase"""
        
        # Check which models are available and suitable for this phase
        available_models = []
        
        for model_name, config in self.model_configs.items():
            if phase in config.use_for_phases:
                if model_name == "grok-fast" and self.xai_client:
                    available_models.append((model_name, config.cost_per_1k_tokens))
                elif model_name == "grok-standard" and self.xai_client:
                    available_models.append((model_name, config.cost_per_1k_tokens))
                elif model_name == "claude" and self.claude_client:
                    available_models.append((model_name, config.cost_per_1k_tokens))
        
        if not available_models:
            print(f"⚠️ No available models for phase {phase.value}")
            return None
        
        # Smart model selection based on phase requirements
        if phase == AnalysisPhase.INITIAL_SCAN:
            # Prefer fast Grok for initial scanning
            for model_name, _ in available_models:
                if model_name == "grok-fast":
                    return model_name
                    
        elif phase in [AnalysisPhase.CODE_IMPROVEMENT, AnalysisPhase.PERFORMANCE_ANALYSIS]:
            # Prefer standard Grok for code work
            for model_name, _ in available_models:
                if model_name == "grok-standard":
                    return model_name
                    
        elif phase in [AnalysisPhase.DEEP_SECURITY, AnalysisPhase.ARCHITECTURE_REVIEW, AnalysisPhase.FINAL_VALIDATION]:
            # Prefer Claude for deep analysis
            for model_name, _ in available_models:
                if model_name == "claude":
                    return model_name
        
        # Fallback to first available model
        return available_models[0][0]

    async def _execute_ai_analysis(self, model_name: str, system_prompt: str, 
                                 analysis_prompt: str, phase: AnalysisPhase) -> Tuple[Dict[str, Any], int]:
        """Execute AI analysis with the specified model"""
        
        config = self.model_configs[model_name]
        
        try:
            if model_name in ["grok-fast", "grok-standard"] and self.xai_client:
                # Use XAI SDK for Grok models (async-safe)
                def _call_xai():
                    chat = self.xai_client.chat.create(
                        model=config.model_name,
                        temperature=config.temperature,
                    )
                    chat.append(xai_system(system_prompt))
                    chat.append(xai_user(analysis_prompt))
                    resp = chat.sample()
                    # SDK returns .content as a string
                    content = getattr(resp, "content", "") or ""
                    # Token usage isn't always exposed; estimate roughly by whitespace count
                    est_tokens = len((system_prompt + analysis_prompt + content).split())
                    return content, est_tokens

                content, token_usage = await asyncio.to_thread(_call_xai)
                
            elif model_name == "claude" and self.claude_client:
                response = await asyncio.to_thread(
                    self.claude_client.messages.create,
                    model=config.model_name,
                    max_tokens=config.max_tokens,
                    temperature=config.temperature,
                    system=system_prompt,
                    messages=[{"role": "user", "content": analysis_prompt}],
                )
                
                # response.content is a list of blocks; join text blocks
                content = "".join(
                    block.text for block in getattr(response, "content", []) if getattr(block, "type", "") == "text"
                )
                token_usage = 0
                if hasattr(response, "usage"):
                    token_usage = int(getattr(response.usage, "input_tokens", 0)) + int(
                        getattr(response.usage, "output_tokens", 0)
                    )
            
            else:
                raise Exception(f"Model {model_name} not available or not configured")
            
            # Parse JSON response (handle markdown code blocks)
            try:
                analysis_data = self._parse_ai_response(content)
            except json.JSONDecodeError:
                # Fallback parsing for non-JSON responses
                analysis_data = {
                    "raw_response": content,
                    "parsing_error": "Failed to parse JSON response",
                    "phase": phase.value
                }
            
            return analysis_data, token_usage
            
        except Exception as e:
            print(f"❌ AI analysis failed for {model_name}: {e}")
            return {
                "error": str(e),
                "phase": phase.value,
                "model": model_name
            }, 0

    def _parse_ai_response(self, content: str) -> Dict[str, Any]:
        """Parse AI response that may contain JSON in markdown code blocks"""
        
        # Try direct JSON parsing first
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # Look for JSON in markdown code blocks
        import re
        
        # Pattern to match JSON in markdown code blocks
        json_patterns = [
            r'```json\n(.*?)\n```',  # Standard markdown code block
            r'```\n(.*?)\n```',      # Generic code block
            r'```json\s*(.*?)\s*```', # With whitespace
            r'`([^`]*)`'             # Inline code
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
            for match in matches:
                try:
                    # Clean up the match
                    json_str = match.strip()
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue
        
        # If no JSON found, try to extract structured data from the text
        analysis_data = {"raw_response": content}
        
        # Extract security scores using regex
        score_patterns = [
            (r'security[_\s]*score[^0-9]*([0-9]+)', 'security_score'),
            (r'performance[_\s]*score[^0-9]*([0-9]+)', 'performance_score'),
            (r'maintainability[_\s]*score[^0-9]*([0-9]+)', 'maintainability_score'),
            (r'overall[_\s]*score[^0-9]*([0-9]+)', 'overall_score')
        ]
        
        for pattern, key in score_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                analysis_data[key] = int(match.group(1))
        
        # Extract vulnerabilities/issues
        if re.search(r'critical|vulnerability|security|exploit', content, re.IGNORECASE):
            # Count vulnerability mentions
            critical_count = len(re.findall(r'critical', content, re.IGNORECASE))
            high_count = len(re.findall(r'high.*severity', content, re.IGNORECASE))
            
            analysis_data['critical_vulnerabilities'] = [{
                'type': 'parsed_from_text',
                'severity': 'critical' if critical_count > 0 else 'high',
                'count': critical_count + high_count,
                'description': 'Vulnerabilities detected in text analysis'
            }]
        
        return analysis_data

    def _calculate_confidence_score(self, model_name: str, analysis_data: Dict, 
                                  phase: AnalysisPhase) -> int:
        """Calculate confidence score for the analysis result"""
        
        base_confidence = {
            "grok-fast": 82,    # Fast but reliable
            "grok-standard": 87, # More thorough
            "claude": 92        # Highest quality
        }.get(model_name, 75)
        
        # Adjust based on response quality
        if "error" in analysis_data:
            return max(20, base_confidence - 50)
        
        if "parsing_error" in analysis_data:
            return max(40, base_confidence - 30)
        
        # Check for comprehensive response
        expected_keys = {
            AnalysisPhase.INITIAL_SCAN: ["critical_vulnerabilities", "security_score"],
            AnalysisPhase.DEEP_SECURITY: ["advanced_vulnerabilities", "security_architecture_issues"],
            AnalysisPhase.PERFORMANCE_ANALYSIS: ["performance_issues", "performance_score"],
            AnalysisPhase.ARCHITECTURE_REVIEW: ["architecture_issues", "maintainability_score"],
            AnalysisPhase.CODE_IMPROVEMENT: ["improved_code", "security_improvements"],
            AnalysisPhase.FINAL_VALIDATION: ["validation_summary", "final_recommendations"]
        }
        
        if phase in expected_keys:
            found_keys = sum(1 for key in expected_keys[phase] if key in analysis_data)
            completeness_bonus = (found_keys / len(expected_keys[phase])) * 10
            base_confidence += completeness_bonus
        
        return min(100, int(base_confidence))

    async def run_comprehensive_analysis(self, code: str, language: str = "python") -> Dict[str, Any]:
        """Run complete multi-phase expert analysis"""
        
        print(f"🔥 Starting comprehensive expert analysis for {language} code")
        
        results = {}
        previous_findings = None
        total_tokens = 0
        total_cost = 0.0
        
        # Define analysis workflow
        analysis_phases = [
            AnalysisPhase.INITIAL_SCAN,
            AnalysisPhase.DEEP_SECURITY,
            AnalysisPhase.PERFORMANCE_ANALYSIS,
            AnalysisPhase.ARCHITECTURE_REVIEW,
            AnalysisPhase.CODE_IMPROVEMENT,
            AnalysisPhase.FINAL_VALIDATION
        ]
        
        for phase in analysis_phases:
            print(f"   🧠 Running {phase.value} analysis...")
            
            try:
                result = await self.run_expert_analysis_phase(
                    phase, code, language, previous_findings
                )
                
                results[phase.value] = {
                    "model_used": result.model_used,
                    "processing_time": result.processing_time,
                    "token_usage": result.token_usage,
                    "confidence_score": result.confidence_score,
                    "analysis": result.analysis_data
                }
                
                # Update costs
                model_config = self.model_configs[result.model_used]
                phase_cost = (result.token_usage / 1000) * model_config.cost_per_1k_tokens
                total_cost += phase_cost
                total_tokens += result.token_usage
                
                # Pass findings to next phase
                previous_findings = result.analysis_data
                
                print(f"   ✅ {phase.value} completed - Confidence: {result.confidence_score}% "
                      f"(${phase_cost:.4f}, {result.token_usage} tokens)")
                
            except Exception as e:
                print(f"   ❌ {phase.value} failed: {e}")
                results[phase.value] = {
                    "error": str(e),
                    "model_used": "none",
                    "processing_time": 0,
                    "confidence_score": 0
                }
        
        # Generate comprehensive summary
        summary = self._generate_comprehensive_summary(results)
        
        final_result = {
            "analysis_timestamp": time.time(),
            "language": language,
            "total_processing_time": sum(r.get("processing_time", 0) for r in results.values()),
            "total_tokens_used": total_tokens,
            "total_cost_usd": total_cost,
            "phase_results": results,
            "comprehensive_summary": summary
        }
        
        print(f"🎉 Comprehensive analysis completed!")
        print(f"   💰 Total cost: ${total_cost:.4f}")
        print(f"   🔢 Total tokens: {total_tokens:,}")
        print(f"   ⏱️  Total time: {final_result['total_processing_time']:.2f}s")
        
        return final_result

    def _generate_comprehensive_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive summary from all analysis phases"""
        
        # Extract key metrics from each phase
        critical_issues = []
        security_scores = []
        performance_scores = []
        recommendations = []
        
        for phase_name, phase_result in results.items():
            if "error" in phase_result:
                continue
                
            analysis = phase_result.get("analysis", {})
            
            # Security issues
            if "critical_vulnerabilities" in analysis:
                critical_issues.extend(analysis["critical_vulnerabilities"])
            if "advanced_vulnerabilities" in analysis:
                critical_issues.extend(analysis["advanced_vulnerabilities"])
                
            # Scores
            if "security_score" in analysis:
                security_scores.append(analysis["security_score"])
            if "performance_score" in analysis:
                performance_scores.append(analysis["performance_score"])
                
            # Recommendations
            if "immediate_actions" in analysis:
                recommendations.extend(analysis["immediate_actions"])
            if "final_recommendations" in analysis:
                recommendations.extend(analysis["final_recommendations"])
        
        return {
            "overall_security_score": int(sum(security_scores) / len(security_scores)) if security_scores else 0,
            "overall_performance_score": int(sum(performance_scores) / len(performance_scores)) if performance_scores else 0,
            "critical_issue_count": len([i for i in critical_issues if i.get("severity") == "critical"]),
            "high_issue_count": len([i for i in critical_issues if i.get("severity") == "high"]),
            "top_priority_actions": recommendations[:10],  # Top 10 recommendations
            "deployment_readiness": "needs_critical_fixes" if len([i for i in critical_issues if i.get("severity") == "critical"]) > 0 else "ready_with_improvements",
            "analysis_quality": "expert_level"
        }

# Example usage and testing
async def test_expert_prompt_system():
    """Test the expert prompt system"""
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    system = ExpertPromptSystem()
    
    # Test with sample vulnerable code
    sample_code = '''
import os
import subprocess

def vulnerable_function(user_input):
    # Command injection vulnerability
    os.system(f"ls {user_input}")
    
    # SQL injection
    query = f"SELECT * FROM users WHERE name = '{user_input}'"
    
    return "executed"
'''
    
    results = await system.run_comprehensive_analysis(sample_code, "python")
    
    print("\n" + "="*80)
    print("EXPERT ANALYSIS RESULTS")
    print("="*80)
    print(json.dumps(results, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(test_expert_prompt_system())
