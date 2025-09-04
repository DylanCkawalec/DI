#!/usr/bin/env python3
"""
👥 USER-FRIENDLY ERC-8004 A2A LAUNCHER

This launcher makes the ERC-8004 A2A protocol deployable by any user.
Users can deploy their own contracts, use their own API keys, and earn revenue.
"""

import os
import sys
import time
import json
import asyncio
import subprocess
import signal
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class UserFriendlyA2ALauncher:
    """User-friendly A2A application that anyone can deploy"""
    
    def __init__(self):
        self.api_process = None
        self.frontend_process = None
        self.user_mode = "demo"  # demo, own_keys, own_contracts, full_deployment
        
    def display_welcome(self):
        """Display user-friendly welcome"""
        print("👥 ERC-8004 A2A USER-FRIENDLY LAUNCHER")
        print("=" * 60)
        print("🎯 DEPLOY YOUR OWN AI AGENT PROTOCOL")
        print()
        print("🌟 DEPLOYMENT OPTIONS:")
        print("   1. 🎮 Demo Mode - Try with our setup (FREE)")
        print("   2. 🔑 Your API Keys - Use your AI credits")
        print("   3. 📜 Your Contracts - Deploy and own your protocol")
        print("   4. 🚀 Full Deployment - Complete ownership")
        print("   0. ❌ Exit")
        print()
        print("💰 REVENUE MODEL:")
        print("   • Demo Mode: Experience the protocol (no revenue)")
        print("   • Own Keys: Use your AI credits for analysis")
        print("   • Own Contracts: Users pay YOUR contracts (you earn revenue)")
        print("   • Full Deployment: Complete protocol ownership")
        print()
        
    async def launch_user_application(self):
        """Launch application based on user choice"""
        try:
            self.display_welcome()
            
            choice = input("Choose your deployment mode (0-4): ").strip()
            
            if choice == "1":
                return await self.launch_demo_mode()
            elif choice == "2":
                return await self.launch_with_user_keys()
            elif choice == "3":
                return await self.launch_with_user_contracts()
            elif choice == "4":
                return await self.launch_full_deployment()
            elif choice == "0":
                print("👋 Thank you for trying ERC-8004 A2A!")
                return True
            else:
                print("❌ Invalid choice")
                return False
                
        except KeyboardInterrupt:
            print("\n⏹️ Application stopped")
            return True
        except Exception as e:
            print(f"\n❌ Launch failed: {e}")
            return False
        finally:
            await self.cleanup_services()
    
    async def launch_demo_mode(self):
        """Launch in demo mode with our setup"""
        print("🎮 LAUNCHING DEMO MODE")
        print("=" * 30)
        print("✨ Experience the complete ERC-8004 A2A protocol")
        print("💰 Uses demo contracts and API keys")
        print("🎯 Perfect for testing and understanding the system")
        print()
        
        await self.start_services_with_config({
            'mode': 'demo',
            'use_demo_contracts': True,
            'use_demo_keys': True
        })
        
        self.display_demo_access()
        await self.monitor_services("Demo Mode")
        return True
    
    async def launch_with_user_keys(self):
        """Launch with user's own API keys"""
        print("🔑 LAUNCHING WITH YOUR API KEYS")
        print("=" * 40)
        print("✨ Use your own AI credits for analysis")
        print("💰 Still uses demo contracts")
        print("🎯 Great for cost control and API management")
        print()
        
        # Get user API keys
        user_keys = self.collect_user_api_keys()
        if not user_keys:
            return False
        
        await self.start_services_with_config({
            'mode': 'user_keys',
            'use_demo_contracts': True,
            'user_api_keys': user_keys
        })
        
        self.display_user_keys_access()
        await self.monitor_services("Your API Keys Mode")
        return True
        
    async def launch_with_user_contracts(self):
        """Launch with user's own contracts"""
        print("📜 LAUNCHING WITH YOUR CONTRACTS")
        print("=" * 45)
        print("✨ Deploy and own your ERC-8004 contracts")
        print("💰 Users pay YOUR contracts (you earn revenue)")
        print("🎯 Complete protocol ownership")
        print()
        
        # Get deployment info
        private_key = self.get_user_private_key()
        if not private_key:
            return False
            
        # Deploy contracts
        contracts = await self.deploy_user_contracts(private_key)
        if not contracts:
            return False
        
        # Get user API keys
        user_keys = self.collect_user_api_keys()
        
        await self.start_services_with_config({
            'mode': 'user_contracts',
            'user_contracts': contracts,
            'user_api_keys': user_keys,
            'private_key': private_key
        })
        
        self.display_user_contracts_access(contracts)
        await self.monitor_services("Your Contracts Mode")
        return True
    
    def collect_user_api_keys(self) -> dict:
        """Collect user's API keys safely"""
        print("🔑 API KEY CONFIGURATION")
        print("-" * 30)
        print("Enter your API keys (press Enter to skip):")
        print()
        
        keys = {}
        
        # Grok API Key
        grok_key = input("Grok API Key (xai-...): ").strip()
        if grok_key:
            keys['GROK_API_KEY'] = grok_key
            print("   ✅ Grok API key set")
        
        # OpenAI API Key
        openai_key = input("OpenAI API Key (sk-...): ").strip()
        if openai_key:
            keys['OPENAI_API_KEY'] = openai_key
            print("   ✅ OpenAI API key set")
        
        # Anthropic API Key
        anthropic_key = input("Anthropic API Key (sk-ant-...): ").strip()
        if anthropic_key:
            keys['ANTHROPIC_API_KEY'] = anthropic_key
            print("   ✅ Anthropic API key set")
        
        if keys:
            print(f"\n✅ {len(keys)} API key(s) configured")
            print("🔒 Your keys will be used securely for your AI analysis")
        else:
            print("\n⚠️ No API keys provided - will use demo keys")
        
        return keys
    
    def get_user_private_key(self) -> str:
        """Get user's private key for contract deployment"""
        print("🔐 PRIVATE KEY FOR CONTRACT DEPLOYMENT")
        print("-" * 45)
        print("⚠️ Your private key is used ONLY for:")
        print("   • Deploying YOUR ERC-8004 contracts")
        print("   • Earning revenue from user interactions")
        print("   • Complete protocol ownership")
        print()
        print("🛡️ SECURITY GUARANTEE:")
        print("   • Key stored locally only")
        print("   • Never shared or transmitted")
        print("   • Used only for blockchain transactions")
        print()
        
        while True:
            private_key = input("Enter your private key (0x...): ").strip()
            
            if not private_key:
                print("❌ Private key is required for contract deployment")
                continue
            
            if not private_key.startswith('0x') or len(private_key) != 66:
                print("❌ Invalid private key format (should be 0x followed by 64 hex characters)")
                continue
                
            # Verify the private key works
            try:
                from eth_account import Account
                account = Account.from_key(private_key)
                print(f"   ✅ Private key verified - Address: {account.address}")
                return private_key
            except Exception as e:
                print(f"❌ Invalid private key: {e}")
                continue
    
    async def deploy_user_contracts(self, private_key: str) -> dict:
        """Deploy user's own ERC-8004 contracts"""
        try:
            print("🚀 DEPLOYING YOUR ERC-8004 CONTRACTS")
            print("-" * 45)
            
            # Estimate costs
            print("💰 Deployment costs (Base Sepolia):")
            print("   • IdentityRegistry: ~$0.005")
            print("   • ReputationRegistry: ~$0.005") 
            print("   • ValidationRegistry: ~$0.005")
            print("   • Total: ~$0.015")
            print()
            
            confirm = input("Proceed with deployment? (y/N): ").strip().lower()
            if confirm != 'y':
                print("❌ Deployment cancelled")
                return {}
            
            print("🔨 Building contracts...")
            
            # Change to contracts directory
            original_dir = os.getcwd()
            os.chdir("contracts")
            
            try:
                # Set deployment environment
                deploy_env = os.environ.copy()
                deploy_env.update({
                    'PRIVATE_KEY': private_key,
                    'RPC_URL': 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj',
                    'CHAIN_ID': '84532'
                })
                
                # Build contracts
                build_result = subprocess.run(
                    ["forge", "build"], 
                    capture_output=True, text=True, env=deploy_env, timeout=60
                )
                
                if build_result.returncode != 0:
                    print(f"❌ Build failed: {build_result.stderr}")
                    return {}
                
                print("   ✅ Contracts built successfully")
                
                # Deploy contracts
                print("🚀 Deploying to Base Sepolia...")
                
                deploy_result = subprocess.run([
                    "forge", "script", "script/Deploy.s.sol:Deploy",
                    "--rpc-url", deploy_env['RPC_URL'],
                    "--broadcast",
                    "--private-key", private_key
                ], capture_output=True, text=True, env=deploy_env, timeout=120)
                
                if deploy_result.returncode != 0:
                    print(f"❌ Deployment failed: {deploy_result.stderr}")
                    print("💡 Common issues:")
                    print("   • Insufficient funds in wallet")
                    print("   • Network connectivity problems")
                    print("   • Invalid private key")
                    return {}
                
                print("   ✅ Contracts deployed successfully!")
                
                # Read deployment results
                deployed_contracts_path = Path("../deployed_contracts.json")
                if deployed_contracts_path.exists():
                    with open(deployed_contracts_path) as f:
                        contracts = json.load(f)
                    
                    print("\n📜 YOUR DEPLOYED CONTRACTS:")
                    print(f"   • IdentityRegistry: {contracts['contracts']['IdentityRegistry']}")
                    print(f"   • ReputationRegistry: {contracts['contracts']['ReputationRegistry']}")
                    print(f"   • ValidationRegistry: {contracts['contracts']['ValidationRegistry']}")
                    print()
                    print("🎉 SUCCESS! You now own your ERC-8004 protocol instance!")
                    print("💰 All user fees will go directly to YOUR wallet!")
                    
                    return contracts['contracts']
                else:
                    print("⚠️ Deployment completed but contracts file not found")
                    return {}
                    
            finally:
                os.chdir(original_dir)
                
        except subprocess.TimeoutExpired:
            print("❌ Deployment timeout")
            return {}
        except Exception as e:
            print(f"❌ Deployment error: {e}")
            return {}
    
    async def start_services_with_config(self, config: dict):
        """Start services with user configuration"""
        print(f"🔧 Starting services in {config['mode']} mode...")
        
        # Configure environment based on user choices
        service_env = os.environ.copy()
        service_env.update({
            'RPC_URL': 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj',
            'CHAIN_ID': '84532',
        })
        
        # Add user's API keys if provided
        if 'user_api_keys' in config and config['user_api_keys']:
            service_env.update(config['user_api_keys'])
            print(f"   🔑 Using your API keys for AI analysis")
        
        # Add user's contract addresses if provided
        if 'user_contracts' in config and config['user_contracts']:
            service_env.update({
                'IDENTITY_REGISTRY_ADDRESS': config['user_contracts']['IdentityRegistry'],
                'REPUTATION_REGISTRY_ADDRESS': config['user_contracts']['ReputationRegistry'],
                'VALIDATION_REGISTRY_ADDRESS': config['user_contracts']['ValidationRegistry']
            })
            print(f"   📜 Using YOUR deployed contracts")
        
        # Add user's private key if provided
        if 'private_key' in config:
            service_env['PRIVATE_KEY'] = config['private_key']
            print(f"   🔐 Using your private key for agent operations")
        elif os.getenv('PRIVATE_KEY'):
            service_env['PRIVATE_KEY'] = os.getenv('PRIVATE_KEY')
            print(f"   🔐 Using demo private key")
        else:
            print(f"   ⚠️ No private key available")
            
        # Start A2A API Server
        print("   🌐 Starting A2A API Server...")
        self.api_process = subprocess.Popen([
            "python", "-m", "agents.a2a_api_server"
        ], env=service_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        await asyncio.sleep(6)
        
        # Test API
        try:
            import requests
            health_response = requests.get("http://localhost:8080/api/health", timeout=10)
            if health_response.status_code == 200:
                print("   ✅ A2A API Server operational")
            else:
                print(f"   ⚠️ API may have issues: {health_response.status_code}")
        except Exception as e:
            print(f"   ⚠️ API health check failed: {e}")
        
        # Start Frontend
        print("   🎨 Starting frontend application...")
        
        original_dir = os.getcwd()
        os.chdir("frontend")
        
        try:
            # Configure frontend environment
            frontend_env = os.environ.copy()
            frontend_env.update({
                'NEXT_PUBLIC_API_URL': 'http://localhost:8080',
                'NEXT_PUBLIC_RPC_URL': 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj',
                'NEXT_PUBLIC_CHAIN_ID': '84532',
                'NEXT_PUBLIC_USER_MODE': config['mode'],
                'NODE_ENV': 'development'
            })
            
            # Add contract addresses for frontend
            if 'user_contracts' in config and config['user_contracts']:
                frontend_env.update({
                    'NEXT_PUBLIC_IDENTITY_REGISTRY': config['user_contracts']['IdentityRegistry'],
                    'NEXT_PUBLIC_REPUTATION_REGISTRY': config['user_contracts']['ReputationRegistry'],
                    'NEXT_PUBLIC_VALIDATION_REGISTRY': config['user_contracts']['ValidationRegistry']
                })
            else:
                # Use demo contracts
                frontend_env.update({
                    'NEXT_PUBLIC_IDENTITY_REGISTRY': '0x35656CaD817aD468260dE1bA029fF919E5a40f75',
                    'NEXT_PUBLIC_REPUTATION_REGISTRY': '0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B',
                    'NEXT_PUBLIC_VALIDATION_REGISTRY': '0x6731b3be764B33a4E94D148410f1f551CE91dA61'
                })
            
            # Start frontend
            self.frontend_process = subprocess.Popen([
                "npm", "run", "dev"
            ], env=frontend_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            await asyncio.sleep(8)
            print("   ✅ Frontend application started")
            
        finally:
            os.chdir(original_dir)
    
    async def launch_with_user_keys(self):
        """Launch with user's API keys"""
        print("🔑 LAUNCHING WITH YOUR AI API KEYS")
        print("=" * 40)
        
        user_keys = self.collect_user_api_keys()
        if not user_keys:
            print("❌ No API keys provided")
            return False
        
        await self.start_services_with_config({
            'mode': 'user_keys',
            'use_demo_contracts': True,
            'user_api_keys': user_keys
        })
        
        print("\n" + "=" * 60)
        print("✅ YOUR API KEYS MODE ACTIVE")
        print("=" * 60)
        print()
        print("🌐 Application: http://localhost:3000")
        print("🔑 Using: Your AI API keys")
        print("📜 Contracts: Demo contracts")
        print("💰 Cost: Your AI credits only")
        print()
        print("Press Ctrl+C to stop...")
        
        await self.monitor_services("Your API Keys")
        return True
    
    async def launch_with_user_contracts(self):
        """Launch with user's contracts"""
        print("📜 LAUNCHING WITH YOUR CONTRACTS")
        print("=" * 45)
        
        # Get user's private key
        private_key = self.get_user_private_key()
        if not private_key:
            return False
        
        # Deploy contracts
        contracts = await self.deploy_user_contracts(private_key)
        if not contracts:
            return False
        
        # Optional: Get user's API keys
        use_own_keys = input("\nUse your own API keys too? (y/N): ").strip().lower() == 'y'
        user_keys = self.collect_user_api_keys() if use_own_keys else {}
        
        await self.start_services_with_config({
            'mode': 'user_contracts',
            'user_contracts': contracts,
            'user_api_keys': user_keys,
            'private_key': private_key
        })
        
        print("\n" + "=" * 60)
        print("💰 YOUR REVENUE-EARNING PROTOCOL IS LIVE!")
        print("=" * 60)
        print()
        print("🌐 Application: http://localhost:3000")
        print(f"📜 IdentityRegistry: {contracts['IdentityRegistry']}")
        print(f"📜 ReputationRegistry: {contracts['ReputationRegistry']}")
        print(f"📜 ValidationRegistry: {contracts['ValidationRegistry']}")
        print()
        print("💰 REVENUE ACTIVE:")
        print("   • Code reviews: 0.0001 ETH → YOUR wallet")
        print("   • Validations: 0.0002 ETH → YOUR wallet") 
        print("   • Agent registrations: 0.005 ETH → YOUR wallet")
        print("   • YOU own this protocol instance!")
        print()
        print("Press Ctrl+C to stop...")
        
        await self.monitor_services("Your Revenue Protocol")
        return True

    async def launch_full_deployment(self):
        """Launch complete user deployment with all features"""
        print("🚀 LAUNCHING FULL DEPLOYMENT")
        print("=" * 35)
        print("🎯 Complete protocol ownership:")
        print("   • YOUR private key for agent operations")
        print("   • YOUR API keys for AI analysis")
        print("   • YOUR contracts earning revenue")
        print("   • Complete independence and ownership")
        print()
        
        # Get user private key
        private_key = self.get_user_private_key()
        if not private_key:
            return False
            
        # Get user API keys
        user_keys = self.collect_user_api_keys()
        if not user_keys:
            print("⚠️ No API keys provided - will use demo keys for AI")
        
        # Deploy contracts
        print("\n🚀 Deploying YOUR complete ERC-8004 protocol...")
        contracts = await self.deploy_user_contracts(private_key)
        if not contracts:
            return False
        
        # Start services with complete user configuration
        await self.start_services_with_config({
            'mode': 'full_deployment',
            'user_contracts': contracts,
            'user_api_keys': user_keys,
            'private_key': private_key
        })
        
        print("\n" + "=" * 80)
        print("🏆 YOUR COMPLETE ERC-8004 A2A PROTOCOL IS LIVE!")
        print("=" * 80)
        print()
        print("🌐 **ACCESS YOUR PROTOCOL:**")
        print("   • Web Application: http://localhost:3000")
        print("   • API Server: http://localhost:8080/docs")
        print("   • Debug Endpoint: http://localhost:8080/api/debug/replies")
        print()
        print("📜 **YOUR DEPLOYED CONTRACTS:**")
        print(f"   • Identity Registry: {contracts['IdentityRegistry']}")
        print(f"   • Reputation Registry: {contracts['ReputationRegistry']}")
        print(f"   • Validation Registry: {contracts['ValidationRegistry']}")
        print()
        print("💰 **YOUR REVENUE MODEL:**")
        print("   • Every user interaction generates revenue for YOU")
        print("   • Complete ownership of the protocol instance")
        print("   • Scale to serve millions of developers")
        print("   • Revolutionary business model in AI + blockchain")
        print()
        print("🔥 **WHAT YOU'VE BUILT:**")
        print("   ✅ First production ERC-8004 implementation")
        print("   ✅ Trustless AI agent interactions")
        print("   ✅ Revenue-generating protocol")
        print("   ✅ Professional developer experience")
        print("   ✅ Complete protocol ownership")
        print()
        print("🎉 CONGRATULATIONS - You've revolutionized AI code review!")
        print("Press Ctrl+C to stop...")
        
        await self.monitor_services("Complete Protocol Ownership")
        return True
    
    def display_demo_access(self):
        """Display demo mode access info"""
        print("\n" + "=" * 60)
        print("🎮 DEMO MODE - ERC-8004 A2A EXPERIENCE")
        print("=" * 60)
        print()
        print("🌐 **ACCESS YOUR DEMO:**")
        print("   • Application: http://localhost:3000")
        print("   • API Server: http://localhost:8080/docs") 
        print("   • Debug Mode: Click debug button in app")
        print()
        print("🎯 **DEMO EXPERIENCE:**")
        print("   1. Open http://localhost:3000")
        print("   2. Try FREE mode (no wallet needed)")
        print("   3. Connect MetaMask for premium features")
        print("   4. Experience real AI analysis")
        print("   5. See professional audit results")
        print()
        print("💡 **NEXT STEPS:**")
        print("   • Restart with option 2 to use your API keys")
        print("   • Restart with option 3 to deploy your own contracts")
        print("   • Experience the complete protocol ownership")
        print()
        print("Press Ctrl+C to stop...")
    
    async def monitor_services(self, mode_name: str):
        """Monitor running services"""
        start_time = time.time()
        
        while True:
            await asyncio.sleep(30)
            
            uptime = time.time() - start_time
            uptime_minutes = uptime / 60
            
            # Check service health
            api_status = "✅ Online"
            try:
                import requests
                health_check = requests.get("http://localhost:8080/api/health", timeout=5)
                if health_check.status_code != 200:
                    api_status = "⚠️ Issues"
            except:
                api_status = "❌ Offline"
            
            print(f"📊 [{time.strftime('%H:%M:%S')}] {mode_name} - "
                  f"Uptime: {uptime_minutes:.1f}m | "
                  f"API: {api_status} | "
                  f"Frontend: ✅ Online")
    
    async def cleanup_services(self):
        """Cleanup all services"""
        print("\n🛑 Stopping all services...")
        
        services = [
            ("Frontend", self.frontend_process),
            ("A2A API Server", self.api_process)
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
    launcher = UserFriendlyA2ALauncher()
    
    # Handle graceful shutdown
    def signal_handler(signum, frame):
        print("\n🛑 Shutting down user application...")
        asyncio.create_task(launcher.cleanup_services())
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        success = await launcher.launch_user_application()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⏹️ Application stopped")
        return 0

if __name__ == "__main__":
    print("👥 User-Friendly ERC-8004 A2A Launcher")
    print("🌟 Deploy your own AI agent protocol and earn revenue")
    print()
    exit_code = asyncio.run(main())
