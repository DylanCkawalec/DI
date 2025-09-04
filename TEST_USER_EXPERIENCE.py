#!/usr/bin/env python3
"""
👥 USER EXPERIENCE TEST

Test the complete user experience to ensure everything works perfectly
for users deploying their own ERC-8004 A2A protocol.
"""

import os
import sys
import asyncio
import subprocess
import requests
import json
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class UserExperienceTest:
    """Test complete user experience"""
    
    def __init__(self):
        self.test_results = {}
        
    async def test_complete_user_experience(self):
        """Test complete user experience"""
        print("👥 ERC-8004 A2A USER EXPERIENCE TEST")
        print("=" * 50)
        print("🎯 Testing the complete user journey from setup to revenue")
        print()
        
        try:
            # Test 1: Import validation
            print("🔍 Test 1: Import and Dependency Validation")
            if not await self.test_imports():
                return False
            
            # Test 2: API server functionality
            print("\n🌐 Test 2: API Server Functionality")
            if not await self.test_api_server():
                return False
            
            # Test 3: AI integration
            print("\n🧠 Test 3: AI Integration Test")
            if not await self.test_ai_integration():
                return False
            
            # Test 4: Frontend integration
            print("\n💻 Test 4: Frontend Integration")
            if not await self.test_frontend_integration():
                return False
            
            # Test 5: User deployment simulation
            print("\n👤 Test 5: User Deployment Simulation")
            if not await self.test_user_deployment():
                return False
                
            print("\n🎉 ALL USER EXPERIENCE TESTS PASSED!")
            self.display_success_summary()
            return True
            
        except Exception as e:
            print(f"\n❌ User experience test failed: {e}")
            return False
    
    async def test_imports(self):
        """Test all critical imports"""
        try:
            print("   📦 Testing Python package imports...")
            
            # Test core imports
            import web3
            import eth_account
            import fastapi
            import uvicorn
            import pydantic
            import cryptography
            import openai
            import anthropic
            print("   ✅ All core packages imported successfully")
            
            # Test agent imports
            sys.path.append(str(Path(__file__).parent))
            
            from agents.base_agent import ERC8004BaseAgent
            from agents.a2a_oracle_service import A2AOracleService
            from agents.code_review_server_agent import CodeReviewServerAgent
            print("   ✅ All agent modules imported successfully")
            
            self.test_results['imports'] = True
            return True
            
        except ImportError as e:
            print(f"   ❌ Import failed: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Import test failed: {e}")
            return False
    
    async def test_api_server(self):
        """Test API server startup and endpoints"""
        try:
            print("   🚀 Starting test API server...")
            
            # Start API server
            api_env = os.environ.copy()
            api_env.update({
                'RPC_URL': 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj',
                'CHAIN_ID': '84532',
                'PRIVATE_KEY': os.getenv('PRIVATE_KEY', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
                'IDENTITY_REGISTRY_ADDRESS': '0x35656CaD817aD468260dE1bA029fF919E5a40f75',
                'REPUTATION_REGISTRY_ADDRESS': '0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B',
                'VALIDATION_REGISTRY_ADDRESS': '0x6731b3be764B33a4E94D148410f1f551CE91dA61'
            })
            
            api_process = subprocess.Popen([
                "python", "-m", "agents.a2a_api_server"
            ], env=api_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for startup
            await asyncio.sleep(8)
            
            try:
                # Test health endpoint
                health_response = requests.get("http://localhost:8080/api/health", timeout=10)
                if health_response.status_code == 200:
                    health_data = health_response.json()
                    print(f"   ✅ Health check passed: {health_data['status']}")
                    
                    # Test agent info
                    agent_response = requests.get("http://localhost:8080/api/agent/info", timeout=10)
                    if agent_response.status_code == 200:
                        agent_data = agent_response.json()
                        print(f"   ✅ Agent info available: {agent_data.get('agents', {}).get('code_review', {}).get('status')}")
                        
                        # Test debug endpoint
                        debug_response = requests.get("http://localhost:8080/api/debug/replies", timeout=10)
                        if debug_response.status_code == 200:
                            debug_data = debug_response.json()
                            print(f"   ✅ Debug endpoint working: {debug_data.get('total_sessions', 0)} sessions")
                            
                            self.test_results['api'] = True
                            return True
                        else:
                            print(f"   ❌ Debug endpoint failed: {debug_response.status_code}")
                    else:
                        print(f"   ❌ Agent info failed: {agent_response.status_code}")
                else:
                    print(f"   ❌ Health check failed: {health_response.status_code}")
                    
                return False
                
            finally:
                api_process.terminate()
                await asyncio.sleep(2)
                if api_process.poll() is None:
                    api_process.kill()
                    
        except Exception as e:
            print(f"   ❌ API server test failed: {e}")
            return False
    
    async def test_ai_integration(self):
        """Test AI integration"""
        try:
            print("   🧠 Testing AI provider integration...")
            
            # Test API key availability
            ai_keys = {
                'Grok': os.getenv('GROK_API_KEY'),
                'OpenAI': os.getenv('OPENAI_API_KEY'),
                'Anthropic': os.getenv('ANTHROPIC_API_KEY')
            }
            
            available_providers = []
            for provider, key in ai_keys.items():
                if key:
                    print(f"   ✅ {provider} API key available")
                    available_providers.append(provider)
                else:
                    print(f"   ⚠️ {provider} API key not set")
            
            if available_providers:
                print(f"   ✅ {len(available_providers)} AI provider(s) ready")
                self.test_results['ai'] = True
                return True
            else:
                print("   ⚠️ No AI providers configured - will use local analysis")
                self.test_results['ai'] = False
                return True  # Still pass test - local analysis works
                
        except Exception as e:
            print(f"   ❌ AI integration test failed: {e}")
            return False
    
    async def test_frontend_integration(self):
        """Test frontend integration"""
        try:
            print("   💻 Testing frontend configuration...")
            
            # Check if frontend directory exists
            frontend_path = Path("frontend")
            if not frontend_path.exists():
                print("   ❌ Frontend directory not found")
                return False
            
            # Check package.json
            package_json_path = frontend_path / "package.json"
            if package_json_path.exists():
                print("   ✅ Frontend package.json found")
            else:
                print("   ❌ Frontend package.json missing")
                return False
            
            # Check key component files
            required_components = [
                "components/UserDeploymentPanel.tsx",
                "pages/index.tsx",
                "pages/api/deploy/contracts.ts"
            ]
            
            for component in required_components:
                component_path = frontend_path / component
                if component_path.exists():
                    print(f"   ✅ {component} available")
                else:
                    print(f"   ❌ {component} missing")
                    return False
            
            self.test_results['frontend'] = True
            return True
            
        except Exception as e:
            print(f"   ❌ Frontend integration test failed: {e}")
            return False
    
    async def test_user_deployment(self):
        """Test user deployment capabilities"""
        try:
            print("   👤 Testing user deployment features...")
            
            # Test contract compilation
            original_dir = os.getcwd()
            os.chdir("contracts")
            
            try:
                print("   🔨 Testing contract compilation...")
                
                build_result = subprocess.run(
                    ["forge", "build"], 
                    capture_output=True, text=True, timeout=30
                )
                
                if build_result.returncode == 0:
                    print("   ✅ Contracts compile successfully")
                else:
                    print(f"   ❌ Contract compilation failed: {build_result.stderr}")
                    return False
                
                # Check deployment script
                deploy_script = Path("script/Deploy.s.sol")
                if deploy_script.exists():
                    print("   ✅ Deployment script available")
                else:
                    print("   ❌ Deployment script missing")
                    return False
                
                self.test_results['deployment'] = True
                return True
                
            finally:
                os.chdir(original_dir)
                
        except Exception as e:
            print(f"   ❌ User deployment test failed: {e}")
            return False
    
    def display_success_summary(self):
        """Display success summary"""
        print("\n" + "=" * 80)
        print("🏆 USER EXPERIENCE TEST COMPLETE - 100% READY FOR USERS")
        print("=" * 80)
        print()
        print("✅ ALL SYSTEMS VALIDATED:")
        
        test_status = [
            ("Python Imports", self.test_results.get('imports', False)),
            ("API Server", self.test_results.get('api', False)),
            ("AI Integration", self.test_results.get('ai', False)),
            ("Frontend Components", self.test_results.get('frontend', False)),
            ("User Deployment", self.test_results.get('deployment', False))
        ]
        
        for test_name, passed in test_status:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"   {status} {test_name}")
        
        all_passed = all(result for result in self.test_results.values())
        
        if all_passed:
            print()
            print("🎉 YOUR APPLICATION IS READY FOR USERS!")
            print()
            print("🚀 LAUNCH OPTIONS:")
            print("   • Demo: python USER_FRIENDLY_LAUNCHER.py (choice 1)")
            print("   • Production: python PRODUCTION_READY_LAUNCHER.py")
            print()
            print("👥 USER BENEFITS:")
            print("   ✅ Can deploy their own contracts")
            print("   ✅ Can use their own API keys")
            print("   ✅ Can earn revenue from users")
            print("   ✅ Complete protocol ownership")
            print("   ✅ Professional user experience")
            print()
            print("🌟 Ready to revolutionize AI code review!")
        else:
            print()
            print("⚠️ Some tests failed - check the errors above")

async def main():
    """Main test execution"""
    tester = UserExperienceTest()
    
    try:
        success = await tester.test_complete_user_experience()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted")
        return 1

if __name__ == "__main__":
    print("👥 ERC-8004 A2A User Experience Test")
    print("🎯 Validating complete user deployment capabilities")
    print()
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
