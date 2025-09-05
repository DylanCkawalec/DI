#!/usr/bin/env python3
"""
Comprehensive Backend Test for ERC-8004 AI Code Analysis

This script tests the complete AI-powered code analysis workflow
using sophisticated prompts and expert-level AI integration.
"""

import os
import sys
import json
import asyncio
import time
from pathlib import Path
from typing import Dict, Any, Optional

# Add project root to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import our expert system and current agents
from expert_prompt_system import ExpertPromptSystem, AnalysisPhase

# Test configuration
class TestConfig:
    """Test configuration and settings"""
    
    def __init__(self):
        self.test_files = {
            "badscript": "badscript.py",
            "sample_vulnerable": self.get_sample_vulnerable_code(),
            "simple_clean": self.get_simple_clean_code()
        }
        
        self.output_dir = Path("test_results")
        self.output_dir.mkdir(exist_ok=True)
        
        self.api_keys_available = {
            "grok": bool(os.getenv('GROK_API_KEY')),
            "openai": bool(os.getenv('OPENAI_API_KEY')),
            "anthropic": bool(os.getenv('ANTHROPIC_API_KEY'))
        }

    def get_sample_vulnerable_code(self) -> str:
        """Sample vulnerable code for testing"""
        return '''
import os
import sqlite3
from flask import Flask, request

app = Flask(__name__)
app.secret_key = "hardcoded_secret"

@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    # SQL injection vulnerability
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = conn.execute(query).fetchone()
    conn.close()
    return str(result)

@app.route('/exec')
def execute_command():
    cmd = request.args.get('cmd')
    # Command injection vulnerability
    output = os.system(cmd)
    return f"Executed: {output}"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Security issues
'''

    def get_simple_clean_code(self) -> str:
        """Simple clean code for comparison"""
        return '''
def calculate_fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number using dynamic programming."""
    if n <= 0:
        raise ValueError("n must be a positive integer")
    
    if n <= 2:
        return 1
    
    # Use dynamic programming to avoid exponential time complexity
    dp = [0, 1, 1]
    for i in range(3, n + 1):
        dp.append(dp[i-1] + dp[i-2])
    
    return dp[n]

def main():
    """Main function with proper error handling."""
    try:
        result = calculate_fibonacci(10)
        print(f"The 10th Fibonacci number is: {result}")
    except ValueError as e:
        print(f"Error: {e}")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
'''

class BackendTester:
    """Comprehensive backend testing system"""
    
    def __init__(self):
        self.config = TestConfig()
        self.expert_system = ExpertPromptSystem()
        self.test_results = {}
        
    def check_prerequisites(self) -> bool:
        """Check if prerequisites for testing are met"""
        print("🔍 Checking prerequisites...")
        
        # Check API keys
        available_apis = sum(self.config.api_keys_available.values())
        print(f"   API Keys Available: {available_apis}/3")
        
        for api, available in self.config.api_keys_available.items():
            status = "✅" if available else "❌"
            print(f"   {status} {api.upper()}: {'Available' if available else 'Missing'}")
        
        if available_apis == 0:
            print("❌ No AI API keys available! Please set at least one:")
            print("   - GROK_API_KEY")
            print("   - OPENAI_API_KEY") 
            print("   - ANTHROPIC_API_KEY")
            return False
        
        # Check badscript.py exists
        badscript_path = Path(self.config.test_files["badscript"])
        if not badscript_path.exists():
            print(f"❌ {badscript_path} not found!")
            return False
        
        print("✅ Prerequisites check passed")
        return True

    async def test_expert_analysis_single_phase(self, code: str, phase: AnalysisPhase) -> Dict[str, Any]:
        """Test single analysis phase"""
        print(f"   🧠 Testing {phase.value} analysis...")
        
        try:
            result = await self.expert_system.run_expert_analysis_phase(
                phase, code, "python"
            )
            
            return {
                "success": True,
                "phase": phase.value,
                "model_used": result.model_used,
                "processing_time": result.processing_time,
                "token_usage": result.token_usage,
                "confidence_score": result.confidence_score,
                "analysis_data": result.analysis_data
            }
        except Exception as e:
            return {
                "success": False,
                "phase": phase.value,
                "error": str(e)
            }

    async def test_comprehensive_analysis(self, test_name: str, code: str) -> Dict[str, Any]:
        """Test comprehensive multi-phase analysis"""
        print(f"\n🚀 Testing comprehensive analysis: {test_name}")
        print(f"   Code length: {len(code)} characters")
        
        start_time = time.time()
        
        try:
            results = await self.expert_system.run_comprehensive_analysis(code, "python")
            
            # Calculate success metrics
            successful_phases = sum(1 for phase_result in results["phase_results"].values() 
                                  if "error" not in phase_result)
            total_phases = len(results["phase_results"])
            
            test_result = {
                "test_name": test_name,
                "success": True,
                "total_time": time.time() - start_time,
                "successful_phases": successful_phases,
                "total_phases": total_phases,
                "success_rate": successful_phases / total_phases if total_phases > 0 else 0,
                "total_cost": results.get("total_cost_usd", 0),
                "total_tokens": results.get("total_tokens_used", 0),
                "comprehensive_summary": results.get("comprehensive_summary", {}),
                "detailed_results": results
            }
            
            print(f"   ✅ Analysis completed: {successful_phases}/{total_phases} phases successful")
            print(f"   💰 Cost: ${test_result['total_cost']:.4f}")
            print(f"   🔢 Tokens: {test_result['total_tokens']:,}")
            print(f"   ⏱️  Time: {test_result['total_time']:.2f}s")
            
            return test_result
            
        except Exception as e:
            print(f"   ❌ Comprehensive analysis failed: {e}")
            return {
                "test_name": test_name,
                "success": False,
                "error": str(e),
                "total_time": time.time() - start_time
            }

    def load_badscript(self) -> str:
        """Load the intentionally vulnerable badscript.py"""
        badscript_path = Path(self.config.test_files["badscript"])
        
        try:
            with open(badscript_path, 'r') as f:
                content = f.read()
            print(f"✅ Loaded badscript.py ({len(content)} characters)")
            return content
        except Exception as e:
            print(f"❌ Failed to load badscript.py: {e}")
            return ""

    def analyze_test_results(self, test_results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze and summarize test results"""
        
        analysis = {
            "total_tests": len(test_results),
            "successful_tests": 0,
            "failed_tests": 0,
            "total_cost": 0.0,
            "total_tokens": 0,
            "total_time": 0.0,
            "api_usage": {},
            "vulnerability_detection": {},
            "performance_analysis": {},
            "code_improvement_quality": {}
        }
        
        for test_name, result in test_results.items():
            if result.get("success", False):
                analysis["successful_tests"] += 1
                analysis["total_cost"] += result.get("total_cost", 0)
                analysis["total_tokens"] += result.get("total_tokens", 0)
                analysis["total_time"] += result.get("total_time", 0)
                
                # Analyze detailed results if available
                if "detailed_results" in result:
                    self._analyze_detailed_results(result["detailed_results"], analysis)
                    
            else:
                analysis["failed_tests"] += 1
        
        analysis["success_rate"] = analysis["successful_tests"] / analysis["total_tests"] if analysis["total_tests"] > 0 else 0
        analysis["average_cost_per_test"] = analysis["total_cost"] / analysis["successful_tests"] if analysis["successful_tests"] > 0 else 0
        
        return analysis

    def _analyze_detailed_results(self, detailed_results: Dict[str, Any], analysis: Dict[str, Any]):
        """Analyze detailed test results for insights"""
        
        phase_results = detailed_results.get("phase_results", {})
        
        # Count vulnerabilities found
        for phase_name, phase_result in phase_results.items():
            if "analysis" not in phase_result:
                continue
                
            phase_analysis = phase_result["analysis"]
            
            # Security vulnerability detection
            if "critical_vulnerabilities" in phase_analysis:
                vuln_count = len(phase_analysis["critical_vulnerabilities"])
                if "critical_vulnerabilities" not in analysis["vulnerability_detection"]:
                    analysis["vulnerability_detection"]["critical_vulnerabilities"] = []
                analysis["vulnerability_detection"]["critical_vulnerabilities"].append(vuln_count)
            
            # Performance issue detection
            if "performance_issues" in phase_analysis:
                perf_count = len(phase_analysis["performance_issues"])
                if "performance_issues" not in analysis["performance_analysis"]:
                    analysis["performance_analysis"]["performance_issues"] = []
                analysis["performance_analysis"]["performance_issues"].append(perf_count)
            
            # Code improvement quality
            if "improved_code" in phase_analysis:
                improved_code = phase_analysis["improved_code"]
                if improved_code and len(improved_code) > 100:  # Basic quality check
                    analysis["code_improvement_quality"]["has_substantial_improvements"] = True

    def save_test_results(self, test_results: Dict[str, Any], analysis: Dict[str, Any]):
        """Save test results to files"""
        
        timestamp = int(time.time())
        
        # Save detailed results
        detailed_file = self.config.output_dir / f"detailed_results_{timestamp}.json"
        with open(detailed_file, 'w') as f:
            json.dump(test_results, f, indent=2, default=str)
        
        # Save analysis summary
        summary_file = self.config.output_dir / f"test_analysis_{timestamp}.json"
        with open(summary_file, 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        # Generate human-readable report
        report_file = self.config.output_dir / f"test_report_{timestamp}.md"
        self._generate_markdown_report(test_results, analysis, report_file)
        
        print(f"\n📁 Test results saved:")
        print(f"   Detailed: {detailed_file}")
        print(f"   Summary: {summary_file}")
        print(f"   Report: {report_file}")

    def _generate_markdown_report(self, test_results: Dict[str, Any], 
                                 analysis: Dict[str, Any], report_file: Path):
        """Generate human-readable markdown report"""
        
        report_content = f"""# ERC-8004 AI Code Analysis Test Report

Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}

## Summary

- **Total Tests**: {analysis['total_tests']}
- **Successful Tests**: {analysis['successful_tests']}
- **Failed Tests**: {analysis['failed_tests']}
- **Success Rate**: {analysis['success_rate']:.1%}
- **Total Cost**: ${analysis['total_cost']:.4f}
- **Total Tokens**: {analysis['total_tokens']:,}
- **Total Time**: {analysis['total_time']:.2f}s
- **Average Cost per Test**: ${analysis['average_cost_per_test']:.4f}

## Test Results

"""
        
        for test_name, result in test_results.items():
            success_icon = "✅" if result.get("success", False) else "❌"
            report_content += f"\n### {success_icon} {test_name}\n\n"
            
            if result.get("success", False):
                report_content += f"- **Cost**: ${result.get('total_cost', 0):.4f}\n"
                report_content += f"- **Tokens**: {result.get('total_tokens', 0):,}\n"
                report_content += f"- **Time**: {result.get('total_time', 0):.2f}s\n"
                report_content += f"- **Phases**: {result.get('successful_phases', 0)}/{result.get('total_phases', 0)}\n"
                
                # Add vulnerability detection summary
                summary = result.get('comprehensive_summary', {})
                if summary:
                    report_content += f"- **Security Score**: {summary.get('overall_security_score', 'N/A')}/100\n"
                    report_content += f"- **Performance Score**: {summary.get('overall_performance_score', 'N/A')}/100\n"
                    report_content += f"- **Critical Issues**: {summary.get('critical_issue_count', 0)}\n"
                    report_content += f"- **High Issues**: {summary.get('high_issue_count', 0)}\n"
            else:
                report_content += f"- **Error**: {result.get('error', 'Unknown error')}\n"
        
        report_content += f"""
## Analysis Quality Assessment

### Vulnerability Detection
- Critical vulnerabilities detected per test: {analysis['vulnerability_detection'].get('critical_vulnerabilities', [])}

### Performance Analysis  
- Performance issues detected per test: {analysis['performance_analysis'].get('performance_issues', [])}

### Code Improvement
- Substantial code improvements generated: {analysis['code_improvement_quality'].get('has_substantial_improvements', False)}

## Recommendations

Based on this test run:

1. **API Integration**: {'All AI APIs working properly' if analysis['success_rate'] > 0.8 else 'Some API issues detected - check credentials and rate limits'}
2. **Cost Efficiency**: Average cost per comprehensive analysis: ${analysis['average_cost_per_test']:.4f}
3. **Performance**: Average processing time: {analysis['total_time'] / analysis['total_tests'] if analysis['total_tests'] > 0 else 0:.2f}s per test

## Next Steps

- {'✅ Ready for production deployment' if analysis['success_rate'] >= 0.9 else '⚠️ Address test failures before production'}
- Consider implementing caching for repeated analyses
- Monitor API usage and costs in production
- Implement rate limiting for API calls

---

*Generated by ERC-8004 Backend Test Suite*
"""
        
        with open(report_file, 'w') as f:
            f.write(report_content)

    async def run_comprehensive_backend_test(self):
        """Run the complete backend test suite"""
        
        print("🚀 Starting Comprehensive Backend Test Suite")
        print("=" * 60)
        
        if not self.check_prerequisites():
            print("❌ Prerequisites not met - aborting tests")
            return False
        
        # Load test data
        badscript_code = self.load_badscript()
        if not badscript_code:
            print("❌ Failed to load badscript.py - aborting")
            return False
        
        # Run test suite
        test_results = {}
        
        # Test 1: Comprehensive analysis of badscript.py
        test_results["badscript_comprehensive"] = await self.test_comprehensive_analysis(
            "BadScript Comprehensive Analysis", 
            badscript_code
        )
        
        # Test 2: Comprehensive analysis of sample vulnerable code
        test_results["sample_vulnerable_comprehensive"] = await self.test_comprehensive_analysis(
            "Sample Vulnerable Code Analysis",
            self.config.test_files["sample_vulnerable"]
        )
        
        # Test 3: Clean code analysis (for comparison)
        test_results["clean_code_comprehensive"] = await self.test_comprehensive_analysis(
            "Clean Code Analysis",
            self.config.test_files["simple_clean"]
        )
        
        # Analyze results
        print("\n" + "=" * 60)
        print("📊 ANALYZING TEST RESULTS")
        print("=" * 60)
        
        analysis = self.analyze_test_results(test_results)
        
        print(f"\n📋 TEST SUMMARY:")
        print(f"   Total Tests: {analysis['total_tests']}")
        print(f"   Successful: {analysis['successful_tests']}")
        print(f"   Failed: {analysis['failed_tests']}")
        print(f"   Success Rate: {analysis['success_rate']:.1%}")
        print(f"   Total Cost: ${analysis['total_cost']:.4f}")
        print(f"   Total Tokens: {analysis['total_tokens']:,}")
        print(f"   Total Time: {analysis['total_time']:.2f}s")
        
        # Save results
        self.save_test_results(test_results, analysis)
        
        # Final assessment
        if analysis['success_rate'] >= 0.8:
            print("\n🎉 BACKEND TEST SUITE PASSED!")
            print("   AI integration is working properly with sophisticated analysis")
            print("   Ready for frontend integration and production deployment")
        else:
            print("\n⚠️ BACKEND TEST SUITE NEEDS ATTENTION")
            print("   Some tests failed - check API keys and configurations")
            print("   Review detailed results before proceeding")
        
        return analysis['success_rate'] >= 0.8

async def main():
    """Main test execution"""
    
    print("🔥 ERC-8004 Expert AI Backend Test Suite")
    print("Testing sophisticated AI integration for code analysis")
    print("=" * 80)
    
    tester = BackendTester()
    success = await tester.run_comprehensive_backend_test()
    
    if success:
        print("\n✅ All tests passed - backend is ready!")
        print("   Next: Update frontend and agents with expert prompts")
    else:
        print("\n❌ Some tests failed - check configuration")
        print("   Fix issues before proceeding with frontend updates")
    
    return 0 if success else 1

if __name__ == "__main__":
    # Ensure we have required environment variables
    required_env_vars = ["GROK_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
    available_env_vars = [var for var in required_env_vars if os.getenv(var)]
    
    if not available_env_vars:
        print("❌ No AI API keys found in environment!")
        print("Please set at least one of:")
        for var in required_env_vars:
            print(f"   - {var}")
        print("\nAdd them to your .env file or export them as environment variables.")
        sys.exit(1)
    
    sys.exit(asyncio.run(main()))
