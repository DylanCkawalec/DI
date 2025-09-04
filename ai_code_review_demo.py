#!/usr/bin/env python3
"""
ERC-8004 AI Code Review Service Demo

This demo showcases the complete ERC-8004 workflow with AI code review agents:
1. Deploy contracts to Base Sepolia
2. Register three agents (Server, Validator, Client)
3. Perform code review using AI
4. Validate the review quality
5. Submit validation response on-chain
6. Authorize feedback and complete the trust cycle

This demonstrates how AI agents can work together trustlessly using blockchain infrastructure.
"""

import os
import sys
import json
import hashlib
import asyncio
import time
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.append(str(Path(__file__).parent))

from agents.base_agent import ERC8004BaseAgent
from agents.code_review_server_agent import CodeReviewServerAgent, CodeReviewRequest
from agents.code_review_validator_agent import CodeReviewValidatorAgent, ValidationRequest

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration from environment
PRIVATE_KEY = os.getenv('PRIVATE_KEY')

# Validate required environment variables
if not PRIVATE_KEY:
    print("❌ Error: PRIVATE_KEY not set in environment variables")
    print("Please set PRIVATE_KEY in your .env file")
    sys.exit(1)

# Sample code for review (Python with some issues)
SAMPLE_CODE = """
import os
import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/execute')
def execute_command():
    # Security issue: executing user input directly
    cmd = request.args.get('cmd')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

@app.route('/read_file')
def read_file():
    # Security issue: path traversal vulnerability
    filename = request.args.get('file')
    with open(filename, 'r') as f:
        return f.read()

def complex_nested_function():
    # Performance issue: deeply nested loops
    for i in range(100):
        for j in range(100):
            for k in range(100):
                for l in range(100):  # Too deeply nested
                    if i * j * k * l == 42:
                        return True
    return False

# Style issue: unused import
import random

class MyClass:
    def __init__(self):
        # Security issue: using eval
        self.data = eval(request.form.get('data', '{}'))
    
    def process_data(self):
        # No error handling
        return self.data['key']

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Security issue: debug in production
"""

class AICodeReviewDemo:
    """Complete demo of ERC-8004 AI Code Review Service"""
    
    def __init__(self):
        self.server_agent = None
        self.validator_agent = None
        self.client_agent = None
        self.demo_results = {}
        
        print("🚀 ERC-8004 AI Code Review Service Demo")
        print("=" * 50)
        print("This demo showcases trustless AI agent interactions using blockchain")
        print()

    async def run_complete_demo(self):
        """Run the complete end-to-end demo"""
        try:
            # Step 1: Initialize agents
            await self._step1_initialize_agents()
            
            # Step 2: Register agents with ERC-8004
            await self._step2_register_agents()
            
            # Step 3: Perform AI code review
            await self._step3_perform_code_review()
            
            # Step 4: Validate the code review
            await self._step4_validate_review()
            
            # Step 5: Submit validation on-chain
            await self._step5_submit_validation()
            
            # Step 6: Complete trust cycle with feedback
            await self._step6_complete_trust_cycle()
            
            # Step 7: Display final results
            await self._step7_display_results()
            
            print("\n🎉 Demo completed successfully!")
            print("This demonstrates the complete ERC-8004 trustless agent workflow:")
            print("✅ Blockchain-based agent identities")
            print("✅ AI-powered code review service")
            print("✅ Independent validation and quality assurance")
            print("✅ On-chain trust and reputation system")
            print("✅ Complete audit trail and transparency")
            
            return True
            
        except Exception as e:
            print(f"❌ Demo failed: {str(e)}")
            print(f"📍 Error details: {e}")
            return False

    async def _step1_initialize_agents(self):
        """Step 1: Initialize the three types of agents"""
        print("📋 Step 1: Initializing AI Agents")
        print("-" * 30)
        
        # For Anvil testing, use pre-funded accounts
        if os.getenv('CHAIN_ID') == '31337':  # Anvil
            # Use actual Anvil pre-funded accounts
            server_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"     # Account 0
            validator_key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"  # Account 1
            client_key = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"      # Account 3 (has funds)
        else:
            # For other networks, use user's key and derived keys
            server_key = PRIVATE_KEY
            validator_key = os.getenv('VALIDATOR_PRIVATE_KEY', hashlib.sha256(f"{PRIVATE_KEY}validator".encode()).hexdigest())
            client_key = os.getenv('CLIENT_PRIVATE_KEY', hashlib.sha256(f"{PRIVATE_KEY}client".encode()).hexdigest())
        
        print("🤖 Initializing Server Agent (AI Code Review Service)...")
        self.server_agent = CodeReviewServerAgent(
            server_key, 
            "alice-code-review.erc8004.dev"
        )
        
        print("🛡️  Initializing Validator Agent (Review Quality Assurance)...")
        self.validator_agent = CodeReviewValidatorAgent(
            validator_key,
            "bob-validator.erc8004.dev"
        )
        
        print("👤 Initializing Client Agent (Feedback Provider)...")
        self.client_agent = ERC8004BaseAgent(
            "charlie-client.erc8004.dev",
            client_key
        )
        
        print("✅ All agents initialized successfully")
        time.sleep(1)

    async def _step2_register_agents(self):
        """Step 2: Register all agents with ERC-8004 registries"""
        print("\n📋 Step 2: Registering Agents with ERC-8004")
        print("-" * 40)
        
        agents = [
            ("Alice (Server)", self.server_agent),
            ("Bob (Validator)", self.validator_agent), 
            ("Charlie (Client)", self.client_agent)
        ]
        
        for name, agent in agents:
            if not agent.agent_id:
                print(f"📝 Registering {name}...")
                try:
                    agent_id = agent.register_agent()
                    print(f"✅ {name} registered with ID: {agent_id}")
                    time.sleep(2)  # Wait between registrations
                except Exception as e:
                    print(f"❌ Failed to register {name}: {e}")
                    raise
            else:
                print(f"✅ {name} already registered with ID: {agent.agent_id}")
        
        self.demo_results['agent_ids'] = {
            'server': self.server_agent.agent_id,
            'validator': self.validator_agent.agent_id,
            'client': self.client_agent.agent_id
        }

    async def _step3_perform_code_review(self):
        """Step 3: Server agent performs AI code review"""
        print("\n📋 Step 3: AI Code Review Service")
        print("-" * 30)
        
        print("🔍 Analyzing code with AI agents...")
        print(f"📄 Code sample: {len(SAMPLE_CODE)} characters of Python code")
        print("🎯 Focus areas: security, performance, maintainability, style")
        
        # Create review request
        review_request = CodeReviewRequest(
            code=SAMPLE_CODE,
            language="python",
            filename="vulnerable_app.py",
            description="Flask web application with potential security issues",
            focus_areas=["security", "performance", "maintainability", "style"]
        )
        
        # Perform code review
        try:
            review_response = await self.server_agent._perform_code_review(review_request)
            
            print("✅ Code review completed!")
            print(f"📊 Overall Score: {review_response.overall_score}/100")
            print(f"🔒 Security Score: {review_response.security_score}/100")
            print(f"⚡ Performance Score: {review_response.performance_score}/100")
            print(f"🔧 Maintainability Score: {review_response.maintainability_score}/100")
            print(f"✨ Style Score: {review_response.style_score}/100")
            print(f"🚨 Issues Found: {len(review_response.issues)}")
            print(f"💡 Recommendations: {len(review_response.recommendations)}")
            
            # Store for validation
            self.demo_results['review'] = {
                'review_id': review_response.review_id,
                'request': review_request.dict(),
                'response': review_response.dict()
            }
            
            # Display some issues
            if review_response.issues:
                print("\n🚨 Key Issues Identified:")
                for issue in review_response.issues[:3]:  # Show first 3 issues
                    print(f"   • {issue.get('type', 'Unknown')}: {issue.get('message', 'No message')}")
            
            # Display recommendations
            if review_response.recommendations:
                print("\n💡 Top Recommendations:")
                for rec in review_response.recommendations[:2]:  # Show first 2 recommendations
                    print(f"   • {rec}")
                    
        except Exception as e:
            print(f"❌ Code review failed: {e}")
            raise

    async def _step4_validate_review(self):
        """Step 4: Validator agent validates the code review quality"""
        print("\n📋 Step 4: Independent Review Validation")
        print("-" * 35)
        
        print("🛡️  Validator performing independent analysis...")
        
        review_data = self.demo_results['review']
        
        # Create validation request
        validation_request = ValidationRequest(
            review_id=review_data['review_id'],
            original_code=review_data['request']['code'],
            original_response=review_data['response'],
            server_agent_id=self.server_agent.agent_id
        )
        
        try:
            validation_response = await self.validator_agent._validate_code_review(validation_request)
            
            print("✅ Validation completed!")
            print(f"🎯 Validation Score: {validation_response.validation_score}/100")
            print(f"🎯 Accuracy Score: {validation_response.accuracy_score}/100")  
            print(f"📋 Completeness Score: {validation_response.completeness_score}/100")
            print(f"🔬 Methodology Score: {validation_response.methodology_score}/100")
            print(f"⚠️  Discrepancies Found: {len(validation_response.discrepancies)}")
            print(f"🏆 Recommendation: {validation_response.recommendation}")
            
            self.demo_results['validation'] = {
                'validation_id': validation_response.validation_id,
                'response': validation_response.dict()
            }
            
            # Show discrepancies if any
            if validation_response.discrepancies:
                print("\n⚠️  Validation Discrepancies:")
                for disc in validation_response.discrepancies:
                    print(f"   • {disc.get('type', 'Unknown')}: {disc.get('severity', 'unknown')} severity")
                    
        except Exception as e:
            print(f"❌ Validation failed: {e}")
            raise

    async def _step5_submit_validation(self):
        """Step 5: Submit validation response on-chain"""
        print("\n📋 Step 5: On-Chain Validation Submission")
        print("-" * 38)
        
        validation_data = self.demo_results['validation']['response']
        review_id = self.demo_results['review']['review_id']
        
        # Create data hash for validation
        data_to_hash = f"{review_id}{SAMPLE_CODE}{validation_data['validation_score']}"
        data_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
        data_hash_bytes = bytes.fromhex(data_hash)
        
        print(f"📊 Submitting validation score: {validation_data['validation_score']}/100")
        print(f"🔍 Data hash: {data_hash[:16]}...")
        
        try:
            # Server agent requests validation first
            print("📝 Server agent requesting validation...")
            tx_hash = self.server_agent.request_validation(
                self.validator_agent.agent_id,
                data_hash_bytes
            )
            print(f"✅ Validation request submitted: {tx_hash[:10]}...")
            
            # Wait a moment for the request to be mined
            time.sleep(3)
            
            # Validator agent submits response
            print("📊 Validator submitting validation response...")
            response_tx = self.validator_agent.submit_validation_response(
                data_hash_bytes,
                validation_data['validation_score']
            )
            print(f"✅ Validation response submitted: {response_tx[:10]}...")
            
            self.demo_results['blockchain'] = {
                'validation_request_tx': tx_hash,
                'validation_response_tx': response_tx,
                'data_hash': data_hash
            }
            
        except Exception as e:
            print(f"❌ On-chain validation failed: {e}")
            raise

    async def _step6_complete_trust_cycle(self):
        """Step 6: Complete the trust cycle with feedback authorization"""
        print("\n📋 Step 6: Trust Cycle Completion")
        print("-" * 30)
        
        print("🔐 Server authorizing client feedback...")
        
        try:
            # Server agent authorizes client feedback
            feedback_tx = self.server_agent.authorize_feedback(
                self.client_agent.agent_id
            )
            print(f"✅ Feedback authorization completed: {feedback_tx[:10]}...")
            
            self.demo_results['trust_cycle'] = {
                'feedback_authorization_tx': feedback_tx
            }
            
            print("🎉 Trust cycle completed successfully!")
            print("   • Server provided AI code review service")
            print("   • Validator verified review quality")  
            print("   • Validation score submitted on-chain")
            print("   • Feedback channel authorized for reputation building")
            
        except Exception as e:
            print(f"❌ Trust cycle completion failed: {e}")
            raise

    async def _step7_display_results(self):
        """Step 7: Display comprehensive demo results"""
        print("\n📋 Step 7: Demo Results Summary")
        print("=" * 35)
        
        print("🏗️  ERC-8004 Infrastructure:")
        print(f"   • Identity Registry: {self.server_agent.identity_registry_address[:10]}...")
        print(f"   • Reputation Registry: {self.server_agent.reputation_registry_address[:10]}...")
        print(f"   • Validation Registry: {self.server_agent.validation_registry_address[:10]}...")
        
        print("\n🤖 Agent Identities:")
        agent_ids = self.demo_results['agent_ids']
        print(f"   • Alice (Server): Agent ID {agent_ids['server']}")
        print(f"   • Bob (Validator): Agent ID {agent_ids['validator']}")
        print(f"   • Charlie (Client): Agent ID {agent_ids['client']}")
        
        print("\n🔍 AI Code Review Results:")
        review = self.demo_results['review']['response']
        print(f"   • Review ID: {review['review_id']}")
        print(f"   • Overall Score: {review['overall_score']}/100")
        print(f"   • Issues Detected: {len(review['issues'])}")
        print(f"   • AI Recommendations: {len(review['recommendations'])}")
        
        print("\n🛡️  Validation Results:")
        validation = self.demo_results['validation']['response']
        print(f"   • Validation ID: {validation['validation_id']}")
        print(f"   • Validation Score: {validation['validation_score']}/100")
        print(f"   • Accuracy: {validation['accuracy_score']}/100")
        print(f"   • Recommendation: {validation['recommendation']}")
        
        print("\n⛓️  Blockchain Transactions:")
        blockchain = self.demo_results['blockchain']
        print(f"   • Validation Request: {blockchain['validation_request_tx'][:20]}...")
        print(f"   • Validation Response: {blockchain['validation_response_tx'][:20]}...")
        print(f"   • Feedback Auth: {self.demo_results['trust_cycle']['feedback_authorization_tx'][:20]}...")
        
        print("\n📊 Trust Metrics:")
        print(f"   • Code Quality Score: {review['overall_score']}/100")
        print(f"   • Review Validation: {validation['validation_score']}/100")
        print(f"   • System Reliability: {'High' if validation['validation_score'] > 80 else 'Medium'}")
        
        # Save complete results
        results_file = Path("demo_results.json")
        with open(results_file, 'w') as f:
            json.dump({
                **self.demo_results,
                'timestamp': datetime.now().isoformat(),
                'demo_status': 'completed',
                'summary': {
                    'code_quality_score': review['overall_score'],
                    'validation_score': validation['validation_score'],
                    'trust_level': 'High' if validation['validation_score'] > 80 else 'Medium'
                }
            }, f, indent=2)
        
        print(f"\n📁 Complete results saved to: {results_file}")

async def main():
    """Main demo execution"""
    demo = AICodeReviewDemo()
    success = await demo.run_complete_demo()
    
    if success:
        print("\n" + "=" * 60)
        print("🏆 ERC-8004 AI CODE REVIEW DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print("This demo proved that:")
        print("✅ AI agents can provide valuable code review services")
        print("✅ Independent validation ensures quality and trust")
        print("✅ Blockchain provides transparent audit trail")
        print("✅ Trustless interactions work across organizational boundaries")
        print("✅ The ERC-8004 standard enables a decentralized agent economy")
        print()
        print("🚀 Ready for Base Mainnet deployment!")
        return 0
    else:
        print("\n❌ Demo failed - check the errors above")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
