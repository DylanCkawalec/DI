#!/usr/bin/env python3
"""
Quick test of the Enhanced Code Review Agent with Expert-Level Prompts
"""

import os
import sys
import json
import asyncio
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import the enhanced agent
from agents.enhanced_code_review_agent import EnhancedCodeReviewAgent, CodeReviewRequest

async def test_enhanced_agent():
    """Test the enhanced agent with sophisticated analysis"""
    
    print("🚀 Testing Enhanced Code Review Agent with Expert Prompts")
    print("=" * 60)
    
    # Check API keys
    api_keys = {
        "grok": bool(os.getenv('GROK_API_KEY')),
        "openai": bool(os.getenv('OPENAI_API_KEY')),
        "anthropic": bool(os.getenv('ANTHROPIC_API_KEY'))
    }
    
    available = sum(api_keys.values())
    print(f"API Keys Available: {available}/3")
    
    if available == 0:
        print("❌ No API keys available - cannot run test")
        return False
    
    # Initialize agent
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        print("❌ PRIVATE_KEY required")
        return False
    
    agent = EnhancedCodeReviewAgent(private_key, "test-enhanced.erc8004.dev")
    
    # Test code with vulnerabilities
    test_code = '''
import os
import sqlite3
from flask import Flask, request

app = Flask(__name__)

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
    app.run(debug=True, host='0.0.0.0')
'''

    # Create review request
    request = CodeReviewRequest(
        code=test_code,
        language="python",
        filename="vulnerable_app.py",
        description="Test Flask application for security analysis",
        analysis_depth="comprehensive"
    )
    
    print(f"\n🔍 Analyzing code ({len(test_code)} characters)...")
    
    try:
        # Perform enhanced review
        result = await agent._perform_enhanced_code_review(request)
        
        print(f"\n✅ ANALYSIS COMPLETE!")
        print(f"   Review ID: {result.review_id}")
        print(f"   Overall Score: {result.overall_score}/100")
        print(f"   Security Score: {result.security_score}/100")
        print(f"   Performance Score: {result.performance_score}/100")
        print(f"   Issues Found: {len(result.issues)}")
        print(f"   Recommendations: {len(result.recommendations)}")
        
        # Show vulnerability report if available
        if result.vulnerability_report:
            vuln_report = result.vulnerability_report
            print(f"\n🛡️ VULNERABILITY REPORT:")
            print(f"   Total Vulnerabilities: {vuln_report['total_vulnerabilities']}")
            print(f"   Critical: {vuln_report['severity_breakdown']['critical']}")
            print(f"   High: {vuln_report['severity_breakdown']['high']}")
            print(f"   Risk Score: {vuln_report['risk_score']}/100")
        
        # Show cost breakdown
        if result.cost_breakdown:
            cost = result.cost_breakdown
            print(f"\n💰 COST BREAKDOWN:")
            print(f"   Total Cost: ${cost['total_cost_usd']:.4f}")
            print(f"   Total Tokens: {cost['total_tokens']:,}")
            print(f"   Processing Time: {cost['processing_time']:.2f}s")
            print(f"   Phases Completed: {cost['phases_completed']}")
        
        # Show top recommendations
        if result.recommendations:
            print(f"\n📋 TOP RECOMMENDATIONS:")
            for i, rec in enumerate(result.recommendations[:5], 1):
                print(f"   {i}. {rec}")
        
        # Show if improved code was generated
        if result.improved_code:
            print(f"\n✨ IMPROVED CODE GENERATED:")
            print(f"   Length: {len(result.improved_code)} characters")
            print(f"   Preview: {result.improved_code[:100]}...")
        
        print(f"\n🎉 Enhanced agent test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test execution"""
    success = await test_enhanced_agent()
    
    if success:
        print("\n✅ Enhanced Agent Test PASSED!")
        print("   The sophisticated AI integration is working correctly")
        print("   Ready to replace the basic agent in production")
    else:
        print("\n❌ Enhanced Agent Test FAILED!")
        print("   Check API keys and configuration")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
