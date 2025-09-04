#!/usr/bin/env python3
"""
🚀 ERC-8004 AI Code Review Service - Quick Launcher

Quick launcher for ERC-8004 system. For full features, use FINAL_DEMO.py

Usage: python START_APPLICATION.py

What it does:
1. ✅ Starts Anvil blockchain (local Ethereum)
2. ✅ Deploys all ERC-8004 contracts  
3. ✅ Registers AI agents (Server, Validator, Client)
4. ✅ Runs complete AI code review demo
5. ✅ Starts frontend UI on http://localhost:3000

Requirements:
- Python dependencies installed (pip install -r requirements.txt)
- Foundry installed (for Anvil and contract deployment)
- .env file with API keys configured
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

async def main():
    print("🚀 ERC-8004 AI Code Review Service")
    print("=" * 50)
    print("🎯 Production-ready AI code review with blockchain trust")
    print("🔗 Using ERC-8004 Trustless Agents standard")
    print()
    
    print("Select what you want to run:")
    print("1. Complete Demo (Recommended) - Full ERC-8004 workflow test")
    print("2. Full Stack - Run complete application with frontend")
    print("3. AI Only - Test AI functionality without blockchain")
    print("4. Deploy to Base Sepolia - Deploy to testnet")
    print()
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == "1":
        print("🎬 Running Complete ERC-8004 Demo...")
        from scripts.run_complete_demo import main as demo_main
        return await demo_main()
        
    elif choice == "2":
        print("🚀 Starting Full Application Stack...")
        from scripts.run_full_stack import main as stack_main
        return await stack_main()
        
    elif choice == "3":
        print("🤖 Testing AI Functionality...")
        from demo_ai_only import main as ai_main
        return await ai_main()
        
    elif choice == "4":
        print("🌐 Deploying to Base Sepolia...")
        import subprocess
        result = subprocess.run(["python", "scripts/deploy_base_sepolia.py"])
        return result.returncode
        
    else:
        print("❌ Invalid choice. Please run again with 1-4.")
        return 1

if __name__ == "__main__":
    print("🔥 Starting ERC-8004 AI Code Review Service...")
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
