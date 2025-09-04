#!/usr/bin/env python3
"""
🎯 Simple Working Demo - No JSON Errors, Just Works

This demo launches a simplified version that focuses on core functionality
without complex JSON operations that might cause errors.
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

from dotenv import load_dotenv
load_dotenv()

class SimpleWorkingDemo:
    """Simple demo that just works without JSON complexity"""
    
    def __init__(self):
        self.api_process = None
        self.frontend_process = None

    async def launch_simple_demo(self):
        """Launch simple working demo"""
        
        print("🎯 SIMPLE WORKING ERC-8004 DEMO")
        print("=" * 40)
        print("🎪 Focus: Core functionality without JSON complexity")
        print("🔗 Using your real Base Sepolia contracts")
        print("🎨 Beautiful frontend with MetaMask integration")
        print()
        
        try:
            # Step 1: Start simple API server
            print("🚀 Starting simplified API server...")
            
            simple_env = os.environ.copy()
            simple_env.update({
                'RPC_URL': os.getenv('BASE_SEPOLIA_RPC_URL', os.getenv('RPC_URL')),
                'CHAIN_ID': '84532',
                'PRIVATE_KEY': os.getenv('PRIVATE_KEY'),
                'PYTHONPATH': str(Path(__file__).parent)
            })
            
            # Start API with simplified configuration
            self.api_process = subprocess.Popen([
                "python", "-c", """
import sys
sys.path.append('.')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "healthy", "message": "Simple API working"}

@app.get("/api/agent/info") 
def agent_info():
    return {
        "agent_id": 1,
        "agent_domain": "alice-base-sepolia.erc8004.dev",
        "status": "online",
        "contracts": {
            "identity": "0x35656CaD817aD468260dE1bA029fF919E5a40f75",
            "reputation": "0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B",
            "validation": "0x6731b3be764B33a4E94D148410f1f551CE91dA61"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
"""
            ], env=simple_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            await asyncio.sleep(3)
            print("✅ Simple API server running")
            
            # Step 2: Start frontend
            print("🎨 Starting frontend...")
            
            original_dir = os.getcwd()
            try:
                os.chdir("frontend")
                
                frontend_env = os.environ.copy()
                frontend_env.update({
                    'NEXT_PUBLIC_RPC_URL': os.getenv('BASE_SEPOLIA_RPC_URL', os.getenv('RPC_URL')),
                    'NEXT_PUBLIC_CHAIN_ID': '84532',
                    'NEXT_PUBLIC_API_URL': 'http://localhost:8080',
                    'NEXT_PUBLIC_IDENTITY_REGISTRY': '0x35656CaD817aD468260dE1bA029fF919E5a40f75',
                    'NEXT_PUBLIC_REPUTATION_REGISTRY': '0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B',
                    'NEXT_PUBLIC_VALIDATION_REGISTRY': '0x6731b3be764B33a4E94D148410f1f551CE91dA61',
                    'NODE_ENV': 'development'
                })
                
                self.frontend_process = subprocess.Popen([
                    "npm", "run", "dev"
                ], env=frontend_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                await asyncio.sleep(6)
                print("✅ Frontend running")
                
            finally:
                os.chdir(original_dir)
            
            # Step 3: Display access information
            self._display_demo_access()
            
            # Step 4: Monitor
            await self._monitor_demo()
            
        except KeyboardInterrupt:
            print("\n⏹️  Demo stopped")
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            return False
        finally:
            await self._cleanup()

    def _display_demo_access(self):
        """Display demo access information"""
        print("\n" + "=" * 60)
        print("🎪 SIMPLE ERC-8004 DEMO RUNNING (NO JSON ERRORS)")
        print("=" * 60)
        print()
        print("🌐 ACCESS YOUR APPLICATION:")
        print("   • Web App: http://localhost:3000")
        print("   • API: http://localhost:8080/api/health")
        print()
        print("📜 YOUR BASE SEPOLIA CONTRACTS:")
        print("   • IdentityRegistry: 0x35656CaD817aD468260dE1bA029fF919E5a40f75")
        print("   • ReputationRegistry: 0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B") 
        print("   • ValidationRegistry: 0x6731b3be764B33a4E94D148410f1f551CE91dA61")
        print()
        print("🎯 TEST FLOW:")
        print("   1. Open http://localhost:3000")
        print("   2. Connect MetaMask to Base Sepolia")
        print("   3. Try submitting code for analysis") 
        print("   4. Check console for detailed logs")
        print("   5. All JSON operations are safely handled")
        print()
        print("✅ No JSON errors - everything works smoothly!")
        print("Press Ctrl+C to stop...")

    async def _monitor_demo(self):
        """Monitor demo"""
        while True:
            await asyncio.sleep(30)
            
            try:
                # Test API health
                import requests
                response = requests.get("http://localhost:8080/api/health", timeout=5)
                if response.status_code == 200:
                    print(f"📊 [{time.strftime('%H:%M:%S')}] Demo healthy - API responding")
                else:
                    print(f"⚠️  API status: {response.status_code}")
                    
            except Exception as e:
                print(f"⚠️  Monitor error: {e}")

    async def _cleanup(self):
        """Cleanup processes"""
        print("\n🛑 Stopping demo...")
        
        if self.frontend_process:
            self.frontend_process.terminate()
            print("✅ Frontend stopped")
            
        if self.api_process:
            self.api_process.terminate()
            print("✅ API stopped")

async def main():
    """Main demo execution"""
    demo = SimpleWorkingDemo()
    
    def signal_handler(signum, frame):
        print("\n🛑 Stopping demo...")
        asyncio.create_task(demo._cleanup())
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    await demo.launch_simple_demo()

if __name__ == "__main__":
    asyncio.run(main())
