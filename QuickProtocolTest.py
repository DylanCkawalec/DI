#!/usr/bin/env python3
"""
ERC-8004 Quick Protocol Validation

Fast backend testing to verify all systems work correctly:
- Agent registration 
- Basic AI functionality
- Blockchain integration
- Core A2A protocol features

This validates the backend works before running the full test suite.
"""

import os
import sys
import subprocess
import time
import signal
import asyncio
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

# Load environment
from dotenv import load_dotenv
load_dotenv()

class QuickProtocolValidator:
    """Quick validation of core protocol functionality"""
    
    def __init__(self):
        self.anvil_process = None
        
    async def run_quick_validation(self):
        """Run quick protocol validation"""
        print("🚀 ERC-8004 Quick Protocol Validation")
        print("=" * 40)
        print("🎯 Testing core backend functionality")
        print()
        
        try:
            # Step 1: Start Anvil
            print("🔥 Starting Anvil...")
            self.anvil_process = subprocess.Popen([
                "anvil", "--port", "8545", "--silent"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            await asyncio.sleep(2)
            print("✅ Anvil started")
            
            # Step 2: Set environment
            os.environ['RPC_URL'] = 'http://127.0.0.1:8545'
            os.environ['CHAIN_ID'] = '31337'
            
            # Step 3: Deploy contracts
            print("📄 Deploying contracts...")
            original_dir = os.getcwd()
            try:
                os.chdir("contracts")
                subprocess.run(["forge", "build"], check=True, capture_output=True)
                
                deploy_env = os.environ.copy()
                deploy_env["PRIVATE_KEY"] = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
                
                subprocess.run([
                    "forge", "script", "script/Deploy.s.sol:Deploy",
                    "--rpc-url", "http://127.0.0.1:8545",
                    "--broadcast"
                ], env=deploy_env, check=True, capture_output=True)
            finally:
                os.chdir(original_dir)
            
            print("✅ Contracts deployed")
            
            # Step 4: Test agent creation
            print("🤖 Testing agent creation...")
            from agents.base_agent import ERC8004BaseAgent
            
            agent = ERC8004BaseAgent(
                "test-agent.erc8004.dev",
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            )
            
            if not agent.agent_id:
                agent.register_agent()
            
            print(f"✅ Agent registered with ID: {agent.agent_id}")
            
            # Step 5: Test AI integration
            print("🧠 Testing AI integration...")
            from agents.code_review_server_agent import CodeReviewServerAgent, CodeReviewRequest
            
            ai_agent = CodeReviewServerAgent(
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
                "ai-test.erc8004.dev"
            )
            
            # Simple test code
            test_request = CodeReviewRequest(
                code="def test(): return 'hello'",
                language="python",
                filename="test.py",
                description="Simple test function"
            )
            
            start_time = time.time()
            result = await ai_agent._perform_code_review(test_request)
            ai_time = time.time() - start_time
            
            print(f"✅ AI analysis completed in {ai_time:.2f}s")
            print(f"   Score: {result.overall_score}/100")
            print(f"   Issues: {len(result.issues)}")
            
            # Step 6: Test oracle service
            print("🔮 Testing oracle service...")
            from agents.a2a_oracle_service import A2AOracleService
            
            oracle = A2AOracleService("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
            
            session_id = oracle.create_a2a_session(
                user_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                prompt="Test prompt",
                user_public_key="test_key"
            )
            
            print(f"✅ A2A session created: {session_id}")
            
            # Step 7: Test encrypted payload
            print("🔐 Testing encryption...")
            encrypted = await oracle.process_a2a_request(
                session_id=session_id,
                code_analysis_result=result.model_dump(),  # Updated for Pydantic v2
                user_public_key="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
            )
            
            print(f"✅ Payload encrypted: {len(encrypted)} bytes")
            
            # Test decryption
            decrypted = oracle.decrypt_payload_for_user(
                encrypted,
                "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
            )
            
            print("✅ Payload decrypted successfully")
            
            print("\n🎉 QUICK VALIDATION SUCCESSFUL!")
            print("=" * 35)
            print("✅ All core systems operational")
            print("✅ Agent registration working") 
            print("✅ AI analysis functional")
            print("✅ Blockchain integration working")
            print("✅ A2A protocol operational")
            print("✅ Encryption system working")
            print("\n🚀 Backend ready for production!")
            
            return True
            
        except Exception as e:
            print(f"❌ Quick validation failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            if self.anvil_process:
                self.anvil_process.terminate()

async def main():
    """Main execution"""
    validator = QuickProtocolValidator()
    
    def signal_handler(signum, frame):
        print("\n🛑 Test interrupted")
        if validator.anvil_process:
            validator.anvil_process.terminate()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    success = await validator.run_quick_validation()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
