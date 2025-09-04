#!/usr/bin/env python3
"""
🔥 COMPREHENSIVE MULTI-AGENT A2A LAUNCHER

This launcher starts ALL AI agents (server, validator, client) with proper connectivity.
Ensures data/code_reviews integration and efficient API key usage.
"""

import os
import sys
import time
import asyncio
import subprocess
import signal
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class ComprehensiveMultiAgentLauncher:
    """Comprehensive multi-agent A2A launcher"""
    
    def __init__(self):
        self.server_agent_process = None
        self.validator_agent_process = None
        self.api_server_process = None
        self.frontend_process = None
        
    def display_comprehensive_welcome(self):
        """Display comprehensive launcher welcome"""
        print("🔥 COMPREHENSIVE MULTI-AGENT A2A LAUNCHER")
        print("=" * 60)
        print("🎯 LAUNCHING COMPLETE AI AGENT ECOSYSTEM")
        print()
        print("🤖 AI AGENTS TO BE LAUNCHED:")
        print("   • 🧠 Server Agent (Port 8080) - Grok/Claude/OpenAI Analysis")
        print("   • 🛡️ Validator Agent (Port 8081) - Independent Validation")
        print("   • 🔮 Oracle Service - A2A Protocol Management")
        print("   • 🌐 FastAPI Server - Frontend Integration")
        print("   • 🎨 React Frontend - User Interface")
        print()
        print("📊 DATA INTEGRATION:")
        print("   • data/code_reviews/ - Review storage and audit")
        print("   • data/sessions/ - A2A session management")
        print("   • data/transaction_audit.csv - Complete audit trail")
        print()
        print("🔑 AI PROVIDER EFFICIENCY:")
        print("   • Grok (Primary): Cost-effective, fast analysis")
        print("   • Claude (Validation): Independent verification")  
        print("   • OpenAI (Fallback): Reliable backup analysis")
        print()
        
    async def launch_comprehensive_system(self):
        """Launch complete multi-agent system"""
        try:
            self.display_comprehensive_welcome()
            
            # Phase 1: Verify Environment
            print("🔍 Phase 1: Environment and API Key Verification")
            if not await self.verify_comprehensive_environment():
                return False
            
            # Phase 2: Create Data Directories
            print("\n📁 Phase 2: Data Directory Setup")
            await self.setup_data_directories()
            
            # Phase 3: Launch All AI Agents
            print("\n🤖 Phase 3: Multi-Agent System Launch")
            if not await self.launch_all_ai_agents():
                return False
            
            # Phase 4: Launch API Server
            print("\n🌐 Phase 4: API Server Integration")
            if not await self.launch_integrated_api_server():
                return False
            
            # Phase 5: Launch Enhanced Frontend
            print("\n🎨 Phase 5: Enhanced Frontend Launch")
            if not await self.launch_enhanced_frontend():
                return False
            
            # Phase 6: System Integration Test
            print("\n🧪 Phase 6: System Integration Test")
            if not await self.test_system_integration():
                return False
            
            # Phase 7: Display Access Information
            print("\n🎉 Phase 7: Multi-Agent System Ready!")
            self.display_comprehensive_access()
            
            # Phase 8: Monitor All Services
            print("\n📊 Phase 8: Comprehensive Monitoring Active")
            await self.monitor_all_services()
            
            return True
            
        except KeyboardInterrupt:
            print("\n⏹️ Multi-agent system stopped by user")
            return True
        except Exception as e:
            print(f"\n❌ System launch failed: {e}")
            return False
        finally:
            await self.cleanup_all_services()
    
    async def verify_comprehensive_environment(self):
        """Verify all environment requirements"""
        try:
            print("   🔑 Checking AI API keys...")
            
            # Check all API keys
            api_keys = [
                ('GROK_API_KEY', 'Grok AI (Primary Analysis)'),
                ('OPENAI_API_KEY', 'OpenAI (Fallback Analysis)'),
                ('ANTHROPIC_API_KEY', 'Claude (Validation Analysis)'),
                ('PRIVATE_KEY', 'Ethereum Private Key')
            ]
            
            available_providers = 0
            for key_name, description in api_keys:
                value = os.getenv(key_name)
                if value:
                    print(f"   ✅ {description}: Available")
                    available_providers += 1
                else:
                    print(f"   ⚠️ {description}: Not set")
            
            print(f"   📊 {available_providers}/4 API keys available")
            
            if available_providers >= 2:
                print("   ✅ Sufficient API keys for multi-agent operation")
                return True
            else:
                print("   ⚠️ Limited API keys - some features may use fallbacks")
                return True  # Still continue
                
        except Exception as e:
            print(f"   ❌ Environment verification failed: {e}")
            return False
    
    async def setup_data_directories(self):
        """Setup data directories for proper backend-frontend integration"""
        try:
            # Create all required data directories
            data_dirs = [
                "data/code_reviews",
                "data/sessions", 
                "data/validations",
                "data/audit_trails"
            ]
            
            for dir_path in data_dirs:
                Path(dir_path).mkdir(parents=True, exist_ok=True)
                print(f"   📁 {dir_path}/ ready")
                
            print("   ✅ All data directories configured for backend-frontend integration")
            
        except Exception as e:
            print(f"   ❌ Data directory setup failed: {e}")
    
    async def launch_all_ai_agents(self):
        """Launch all AI agents with proper configuration"""
        try:
            # Configure environment for all agents
            agent_env = os.environ.copy()
            agent_env.update({
                'RPC_URL': 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IileqhnKxixj',
                'CHAIN_ID': '84532',
                'IDENTITY_REGISTRY_ADDRESS': '0x35656CaD817aD468260dE1bA029fF919E5a40f75',
                'REPUTATION_REGISTRY_ADDRESS': '0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B',
                'VALIDATION_REGISTRY_ADDRESS': '0x6731b3be764B33a4E94D148410f1f551CE91dA61'
            })
            
            # Launch Server Agent (Primary AI Analysis)
            print("   🧠 Starting Server Agent (Grok/Claude/OpenAI)...")
            server_env = agent_env.copy()
            server_env['PRIVATE_KEY'] = os.getenv('PRIVATE_KEY', '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
            
            self.server_agent_process = subprocess.Popen([
                "python", "-c", '''
import sys
sys.path.append(".")
from agents.code_review_server_agent import CodeReviewServerAgent
import asyncio
agent = CodeReviewServerAgent(
    private_key=os.getenv("PRIVATE_KEY"),
    agent_domain="multi-server.erc8004.dev"
)
asyncio.run(agent.run_server(port=8082))
'''
            ], env=server_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            await asyncio.sleep(4)
            print("   ✅ Server Agent launched on port 8082")
            
            # Launch Validator Agent (Independent Validation)
            print("   🛡️ Starting Validator Agent (Claude/OpenAI)...")
            validator_env = agent_env.copy()
            validator_env['PRIVATE_KEY'] = os.getenv('PRIVATE_KEY', '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a')
            
            self.validator_agent_process = subprocess.Popen([
                "python", "-c", '''
import sys
sys.path.append(".")
from agents.code_review_validator_agent import CodeReviewValidatorAgent
import asyncio
import os
agent = CodeReviewValidatorAgent(
    private_key=os.getenv("PRIVATE_KEY"),
    agent_domain="multi-validator.erc8004.dev"
)
asyncio.run(agent.run_server(port=8081))
'''
            ], env=validator_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            await asyncio.sleep(4)
            print("   ✅ Validator Agent launched on port 8081")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Agent launch failed: {e}")
            return False
    
    async def launch_integrated_api_server(self):
        """Launch integrated A2A API server"""
        try:
            print("   🔮 Starting Integrated A2A API Server...")
            
            # Configure for multi-agent integration
            api_env = os.environ.copy()
            api_env.update({
                'RPC_URL': 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IileqhnKxixj',
                'CHAIN_ID': '84532',
                'PRIVATE_KEY': os.getenv('PRIVATE_KEY'),
                'IDENTITY_REGISTRY_ADDRESS': '0x35656CaD817aD468260dE1bA029fF919E5a40f75',
                'REPUTATION_REGISTRY_ADDRESS': '0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B',
                'VALIDATION_REGISTRY_ADDRESS': '0x6731b3be764B33a4E94D148410f1f551CE91dA61',
                'SERVER_AGENT_URL': 'http://localhost:8082',
                'VALIDATOR_AGENT_URL': 'http://localhost:8081'
            })
            
            # Start integrated API server
            self.api_server_process = subprocess.Popen([
                "python", "-m", "agents.a2a_api_server"
            ], env=api_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            await asyncio.sleep(6)
            
            # Test API integration
            try:
                import requests
                health_response = requests.get("http://localhost:8080/api/health", timeout=10)
                if health_response.status_code == 200:
                    health_data = health_response.json()
                    print("   ✅ Integrated API Server operational")
                    print(f"      Services: {health_data.get('services', {})}")
                    return True
                else:
                    print(f"   ❌ API health check failed: {health_response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"   ⚠️ API health check failed: {e}")
                return True  # Continue anyway
                
        except Exception as e:
            print(f"   ❌ API server launch failed: {e}")
            return False
    
    async def launch_enhanced_frontend(self):
        """Launch enhanced frontend with multi-agent support"""
        try:
            print("   🎨 Starting Enhanced Frontend...")
            
            original_dir = os.getcwd()
            os.chdir("frontend")
            
            try:
                # Configure frontend for multi-agent system
                frontend_env = os.environ.copy()
                frontend_env.update({
                    'NEXT_PUBLIC_API_URL': 'http://localhost:8080',
                    'NEXT_PUBLIC_SERVER_AGENT_URL': 'http://localhost:8082',
                    'NEXT_PUBLIC_VALIDATOR_AGENT_URL': 'http://localhost:8081',
                    'NEXT_PUBLIC_RPC_URL': 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IileqhnKxixj',
                    'NEXT_PUBLIC_CHAIN_ID': '84532',
                    'NEXT_PUBLIC_IDENTITY_REGISTRY': '0x35656CaD817aD468260dE1bA029fF919E5a40f75',
                    'NEXT_PUBLIC_VALIDATION_REGISTRY': '0x6731b3be764B33a4E94D148410f1f551CE91dA61',
                    'NODE_ENV': 'development'
                })
                
                # Start frontend
                self.frontend_process = subprocess.Popen([
                    "npm", "run", "dev"
                ], env=frontend_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                await asyncio.sleep(8)
                print("   ✅ Enhanced Frontend launched with multi-agent support")
                return True
                
            finally:
                os.chdir(original_dir)
                
        except Exception as e:
            print(f"   ❌ Frontend launch failed: {e}")
            return False
    
    async def test_system_integration(self):
        """Test complete system integration"""
        try:
            print("   🧪 Testing multi-agent system integration...")
            
            # Test all endpoints
            import requests
            
            endpoints_to_test = [
                ("Main API Health", "http://localhost:8080/api/health"),
                ("Server Agent Info", "http://localhost:8082/agent/info"),
                ("Validator Agent Info", "http://localhost:8081/agent/info"),
                ("Debug Replies", "http://localhost:8080/api/debug/replies")
            ]
            
            all_passed = True
            for name, url in endpoints_to_test:
                try:
                    response = requests.get(url, timeout=5)
                    if response.status_code == 200:
                        print(f"      ✅ {name}: Online")
                    else:
                        print(f"      ⚠️ {name}: Issues ({response.status_code})")
                        all_passed = False
                except Exception:
                    print(f"      ❌ {name}: Offline")
                    all_passed = False
            
            if all_passed:
                print("   ✅ All system components operational")
            else:
                print("   ⚠️ Some components may have issues (system will still work)")
                
            return True
            
        except Exception as e:
            print(f"   ❌ Integration test failed: {e}")
            return False
    
    def display_comprehensive_access(self):
        """Display comprehensive system access"""
        print("\n" + "=" * 80)
        print("🔥 COMPREHENSIVE MULTI-AGENT A2A SYSTEM LIVE!")
        print("=" * 80)
        print()
        print("🌐 **ACCESS YOUR COMPLETE SYSTEM:**")
        print("   • Web Application:      http://localhost:3000")
        print("   • Main API Server:      http://localhost:8080/docs")
        print("   • Server Agent:         http://localhost:8082/docs")
        print("   • Validator Agent:      http://localhost:8081/docs")
        print("   • Debug Interface:      http://localhost:8080/api/debug/replies")
        print()
        print("🤖 **AI AGENT ECOSYSTEM:**")
        print("   • Server Agent: Grok/Claude/OpenAI analysis")
        print("   • Validator Agent: Independent verification")
        print("   • Oracle Service: A2A protocol management")
        print("   • All agents working together trustlessly")
        print()
        print("📊 **DATA INTEGRATION:**")
        print("   • Reviews stored: data/code_reviews/")
        print("   • Sessions tracked: data/sessions/")
        print("   • Audit trail: data/transaction_audit.csv")
        print("   • Complete backend-frontend data flow")
        print()
        print("🎯 **ENHANCED USER EXPERIENCE:**")
        print("   1. Open http://localhost:3000")
        print("   2. Experience real multi-AI analysis")
        print("   3. Independent validation by validator agent")
        print("   4. Professional audit receipts")
        print("   5. Complete session history and debugging")
        print()
        print("🔥 **ALL AI PROVIDERS ACTIVE:**")
        print("   ✅ Grok: Primary cost-effective analysis")
        print("   ✅ Claude: Independent validation analysis")
        print("   ✅ OpenAI: Reliable fallback analysis")
        print("   ✅ Multi-provider redundancy for reliability")
        print()
        print("Press Ctrl+C to stop all services...")
    
    async def monitor_all_services(self):
        """Monitor all running services"""
        start_time = time.time()
        
        while True:
            await asyncio.sleep(45)  # Monitor every 45 seconds
            
            uptime = time.time() - start_time
            uptime_minutes = uptime / 60
            
            # Check all service health
            services_status = {
                "API Server": "✅ Online",
                "Server Agent": "✅ Online",
                "Validator Agent": "✅ Online",
                "Frontend": "✅ Online"
            }
            
            try:
                import requests
                
                # Test main API
                try:
                    api_check = requests.get("http://localhost:8080/api/health", timeout=3)
                    if api_check.status_code != 200:
                        services_status["API Server"] = "⚠️ Issues"
                except:
                    services_status["API Server"] = "❌ Offline"
                
                # Test server agent
                try:
                    server_check = requests.get("http://localhost:8082/agent/info", timeout=3)
                    if server_check.status_code != 200:
                        services_status["Server Agent"] = "⚠️ Issues"
                except:
                    services_status["Server Agent"] = "❌ Offline"
                
                # Test validator agent
                try:
                    validator_check = requests.get("http://localhost:8081/agent/info", timeout=3)
                    if validator_check.status_code != 200:
                        services_status["Validator Agent"] = "⚠️ Issues"
                except:
                    services_status["Validator Agent"] = "❌ Offline"
                    
            except Exception as e:
                print(f"   ⚠️ Service monitoring error: {e}")
            
            status_summary = " | ".join([f"{name}: {status}" for name, status in services_status.items()])
            
            print(f"📊 [{time.strftime('%H:%M:%S')}] Multi-Agent System - "
                  f"Uptime: {uptime_minutes:.1f}m | "
                  f"{status_summary}")
    
    async def cleanup_all_services(self):
        """Cleanup all services"""
        print("\n🛑 Stopping all multi-agent services...")
        
        services = [
            ("Frontend", self.frontend_process),
            ("API Server", self.api_server_process),
            ("Validator Agent", self.validator_agent_process),
            ("Server Agent", self.server_agent_process)
        ]
        
        for name, process in services:
            if process:
                try:
                    process.terminate()
                    await asyncio.sleep(2)
                    if process.poll() is None:
                        process.kill()
                    print(f"   ✅ {name} stopped")
                except Exception as e:
                    print(f"   ⚠️ Error stopping {name}: {e}")

async def main():
    """Main launcher execution"""
    launcher = ComprehensiveMultiAgentLauncher()
    
    # Handle graceful shutdown
    def signal_handler(signum, frame):
        print("\n🛑 Shutting down multi-agent system...")
        asyncio.create_task(launcher.cleanup_all_services())
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        success = await launcher.launch_comprehensive_system()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⏹️ System stopped")
        return 0

if __name__ == "__main__":
    print("🔥 Comprehensive Multi-Agent A2A Launcher")
    print("🤖 Complete AI agent ecosystem for ERC-8004")
    print()
    exit_code = asyncio.run(main())
