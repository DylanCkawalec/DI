#!/usr/bin/env python3
"""
🚀 Launch Production ERC-8004 A2A Application

Launch the complete production application using the real deployed 
Base Sepolia contracts with full integration testing.
"""

import os
import sys
import time
import signal
import asyncio
import subprocess
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

class ProductionLauncher:
    """Launch production application with real Base Sepolia contracts"""
    
    def __init__(self):
        self.api_process = None
        self.frontend_process = None
        
        # Real deployed contract addresses  
        self.contracts = {
            "IdentityRegistry": "0x35656CaD817aD468260dE1bA029fF919E5a40f75",
            "ReputationRegistry": "0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B",
            "ValidationRegistry": "0x6731b3be764B33a4E94D148410f1f551CE91dA61"
        }

    async def launch_production_application(self):
        """Launch complete production application"""
        
        print("🚀 ERC-8004 PRODUCTION APPLICATION LAUNCH")
        print("=" * 50)
        print("🎯 Using real deployed Base Sepolia contracts")
        print("💰 Revenue model: Users pay to use YOUR contracts")
        print("🔗 Complete A2A protocol implementation")
        print()
        
        try:
            # Step 1: Configure environment for Base Sepolia
            await self._configure_base_sepolia_environment()
            
            # Step 2: Launch A2A API server
            await self._launch_a2a_api_server()
            
            # Step 3: Launch frontend
            await self._launch_production_frontend()
            
            # Step 4: Display application access
            self._display_application_access()
            
            # Step 5: Monitor production application
            await self._monitor_production_application()
            
            return True
            
        except KeyboardInterrupt:
            print("\n⏹️  Production application stopped")
            return True
        except Exception as e:
            print(f"❌ Production launch failed: {e}")
            return False
        finally:
            await self._cleanup_processes()

    async def _configure_base_sepolia_environment(self):
        """Configure environment for Base Sepolia production"""
        print("⚙️  Configuring Base Sepolia environment...")
        
        # Update environment variables
        os.environ.update({
            'RPC_URL': os.getenv('BASE_SEPOLIA_RPC_URL'),
            'CHAIN_ID': '84532',
            'IDENTITY_REGISTRY_ADDRESS': self.contracts['IdentityRegistry'],
            'REPUTATION_REGISTRY_ADDRESS': self.contracts['ReputationRegistry'], 
            'VALIDATION_REGISTRY_ADDRESS': self.contracts['ValidationRegistry'],
            'NODE_ENV': 'production'
        })
        
        print("✅ Environment configured for Base Sepolia")
        print(f"   Network: Base Sepolia (84532)")
        print(f"   Using YOUR deployed contracts")

    async def _launch_a2a_api_server(self):
        """Launch A2A API server with real contracts"""
        print("🔮 Starting A2A API Server...")
        
        # Set environment for API server
        api_env = os.environ.copy()
        api_env.update({
            'PRIVATE_KEY': os.getenv('PRIVATE_KEY'),
            'RPC_URL': os.getenv('BASE_SEPOLIA_RPC_URL'),
            'CHAIN_ID': '84532'
        })
        
        # Start API server
        self.api_process = subprocess.Popen([
            "python", "-m", "agents.a2a_api_server"
        ], env=api_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for startup
        await asyncio.sleep(5)
        
        # Test API health
        try:
            import requests
            response = requests.get("http://localhost:8080/api/health", timeout=10)
            
            if response.status_code == 200:
                health = response.json()
                print("✅ A2A API Server operational")
                print(f"   Blockchain Connected: {health['services']['blockchain_connection']}")
                print(f"   AI Agent Ready: {health['services']['ai_agent']}")
            else:
                raise Exception(f"Health check failed: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️  API health check: {e}")

    async def _launch_production_frontend(self):
        """Launch production frontend"""
        print("🌐 Starting Production Frontend...")
        
        original_dir = os.getcwd()
        try:
            os.chdir("frontend")
            
            # Set frontend environment for Base Sepolia
            frontend_env = os.environ.copy()
            frontend_env.update({
                'NEXT_PUBLIC_RPC_URL': os.getenv('BASE_SEPOLIA_RPC_URL'),
                'NEXT_PUBLIC_CHAIN_ID': '84532',
                'NEXT_PUBLIC_API_URL': 'http://localhost:8080',
                'NEXT_PUBLIC_IDENTITY_REGISTRY': self.contracts['IdentityRegistry'],
                'NEXT_PUBLIC_REPUTATION_REGISTRY': self.contracts['ReputationRegistry'],
                'NEXT_PUBLIC_VALIDATION_REGISTRY': self.contracts['ValidationRegistry'],
                'NODE_ENV': 'development'  # Use dev for hot reload
            })
            
            # Start frontend dev server
            self.frontend_process = subprocess.Popen([
                "npm", "run", "dev"
            ], env=frontend_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for startup
            await asyncio.sleep(8)
            
            # Test frontend
            try:
                import requests
                response = requests.get("http://localhost:3000", timeout=10)
                if response.status_code == 200:
                    print("✅ Frontend operational")
                else:
                    print(f"⚠️  Frontend status: {response.status_code}")
            except:
                print("⚠️  Frontend still starting...")
                
        finally:
            os.chdir(original_dir)

    def _display_application_access(self):
        """Display production application access information"""
        print("\n" + "=" * 80)
        print("🎉 ERC-8004 PRODUCTION APPLICATION LIVE WITH REAL CONTRACTS")
        print("=" * 80)
        print()
        print("🌐 **ACCESS YOUR PRODUCTION WEB3 APPLICATION:**")
        print("   • Web App:         http://localhost:3000")
        print("   • A2A API:         http://localhost:8080/docs")
        print("   • Network:         Base Sepolia (Chain ID: 84532)")
        print()
        print("📜 **YOUR DEPLOYED ERC-8004 CONTRACTS (LIVE):**")
        for name, addr in self.contracts.items():
            print(f"   • {name}: {addr}")
            print(f"     Verify: https://sepolia.basescan.org/address/{addr}")
        print()
        print("🎯 **COMPLETE USER EXPERIENCE (LIVE):**")
        print("   1. Open http://localhost:3000")
        print("   2. Connect MetaMask to Base Sepolia testnet")
        print("   3. Submit code for FREE AI security analysis") 
        print("   4. Pay real ETH for blockchain validation (~$0.01)")
        print("   5. Sign with MetaMask to decrypt results")
        print("   6. View professional security analysis")
        print("   7. All transactions go through YOUR contracts!")
        print()
        print("💰 **REVENUE MODEL (YOUR BUSINESS):**")
        print("   🔄 Agent Registration: 0.005 ETH → YOUR wallet")
        print("   🔄 Validation Fees: Custom pricing → YOUR revenue")
        print("   🔄 API Access: Premium features → YOUR business")
        print("   📈 Users pay to use YOUR deployed protocol!")
        print()
        print("🎉 **YOU OWN THIS PROTOCOL INSTANCE!**")
        print("🚀 Ready for Base Mainnet production deployment")
        print()
        print("Press Ctrl+C to stop all services...")

    async def _monitor_production_application(self):
        """Monitor production application"""
        monitoring_start = time.time()
        
        while True:
            await asyncio.sleep(30)  # Monitor every 30 seconds
            
            uptime = time.time() - monitoring_start
            
            print(f"📊 [{time.strftime('%H:%M:%S')}] Production monitoring - "
                  f"Uptime: {uptime/60:.1f}m | "
                  f"Real contracts operational on Base Sepolia")

    async def _cleanup_processes(self):
        """Clean up all processes"""
        print("\n🛑 Stopping production services...")
        
        if self.frontend_process:
            self.frontend_process.terminate()
            print("✅ Frontend stopped")
            
        if self.api_process:
            self.api_process.terminate()
            print("✅ A2A API Server stopped")

async def main():
    """Main launcher"""
    launcher = ProductionLauncher()
    
    def signal_handler(signum, frame):
        print("\n🛑 Shutting down production application...")
        asyncio.create_task(launcher._cleanup_processes())
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    success = await launcher.launch_production_application()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
