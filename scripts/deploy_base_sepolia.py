#!/usr/bin/env python3
"""
ERC-8004 AI Code Review Service - Base Sepolia Deployment Script
Deploys all ERC-8004 contracts to Base Sepolia testnet with user's credentials
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration from environment variables
PRIVATE_KEY = os.getenv('PRIVATE_KEY')
BASE_SEPOLIA_RPC = os.getenv('BASE_SEPOLIA_RPC_URL', os.getenv('RPC_URL'))
CHAIN_ID = int(os.getenv('BASE_SEPOLIA_CHAIN_ID', os.getenv('CHAIN_ID', '84532')))

# Ensure private key has 0x prefix for Foundry
if PRIVATE_KEY and not PRIVATE_KEY.startswith('0x'):
    PRIVATE_KEY = '0x' + PRIVATE_KEY

# Validate required environment variables
if not PRIVATE_KEY:
    print("❌ Error: PRIVATE_KEY not set in environment variables")
    print("Please set PRIVATE_KEY in your .env file")
    sys.exit(1)
    
if not BASE_SEPOLIA_RPC:
    print("❌ Error: BASE_SEPOLIA_RPC_URL not set in environment variables") 
    print("Please set BASE_SEPOLIA_RPC_URL in your .env file")
    sys.exit(1)

def main():
    """Deploy ERC-8004 contracts to Base Sepolia testnet"""
    
    print("🚀 ERC-8004 AI Code Review Service - Base Sepolia Deployment")
    print("=" * 60)
    print(f"Network: Base Sepolia (Chain ID: {CHAIN_ID})")
    print(f"RPC URL: {BASE_SEPOLIA_RPC}")
    print()

    # Ensure we're in the contracts directory
    contracts_dir = Path(__file__).parent.parent / "contracts"
    os.chdir(contracts_dir)
    
    print("📂 Changed to contracts directory:", contracts_dir)
    
    # Verify contracts compile
    print("\n🔨 Compiling contracts...")
    result = subprocess.run(["forge", "build"], capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Contract compilation failed:")
        print(result.stderr)
        return False
        
    print("✅ Contracts compiled successfully")
    
    # Set environment variables for deployment
    env = os.environ.copy()
    env["PRIVATE_KEY"] = PRIVATE_KEY
    
    # Deploy contracts
    print(f"\n🌐 Deploying to Base Sepolia...")
    print("This will deploy:")
    print("  1. IdentityRegistry")
    print("  2. ReputationRegistry") 
    print("  3. ValidationRegistry")
    print()
    
    deploy_cmd = [
        "forge", "script", "script/Deploy.s.sol:Deploy",
        "--rpc-url", BASE_SEPOLIA_RPC,
        "--private-key", PRIVATE_KEY,
        "--broadcast",
        "--verify",
        "--chain-id", str(CHAIN_ID),
        "-vvv"
    ]
    
    print("🚀 Executing deployment...")
    result = subprocess.run(deploy_cmd, env=env)
    
    if result.returncode == 0:
        print("\n✅ Deployment completed successfully!")
        print("\n📋 Next steps:")
        print("1. Copy contract addresses from the output above")
        print("2. Update your .env file with the deployed addresses")
        print("3. Test the contracts using the frontend or demo script")
        print("4. Run 'python scripts/fund_tee_agents.py' to fund your agents")
        
        # Try to extract addresses from broadcast files
        try:
            extract_addresses()
        except Exception as e:
            print(f"⚠️  Could not auto-extract addresses: {e}")
            print("Please manually copy addresses from deployment output")
            
        return True
    else:
        print("❌ Deployment failed!")
        print("Please check the error messages above")
        return False

def extract_addresses():
    """Extract contract addresses from Foundry broadcast files"""
    broadcast_dir = Path("broadcast/Deploy.s.sol") / str(CHAIN_ID)
    
    if not broadcast_dir.exists():
        print("⚠️  No broadcast directory found")
        return
        
    # Find the latest broadcast file
    broadcast_files = list(broadcast_dir.glob("run-*.json"))
    if not broadcast_files:
        print("⚠️  No broadcast files found")
        return
        
    latest_file = max(broadcast_files, key=lambda p: p.stat().st_mtime)
    
    try:
        with open(latest_file, 'r') as f:
            broadcast_data = json.load(f)
            
        print("\n📋 Deployed Contract Addresses:")
        print("=" * 40)
        
        transactions = broadcast_data.get('transactions', [])
        for tx in transactions:
            if tx.get('transactionType') == 'CREATE':
                contract_name = tx.get('contractName', 'Unknown')
                address = tx.get('contractAddress', 'Unknown')
                print(f"{contract_name}: {address}")
                
        print("\n📝 Add these to your .env file:")
        print("IDENTITY_REGISTRY_ADDRESS=<IdentityRegistry_Address>")
        print("REPUTATION_REGISTRY_ADDRESS=<ReputationRegistry_Address>") 
        print("VALIDATION_REGISTRY_ADDRESS=<ValidationRegistry_Address>")
        
    except Exception as e:
        print(f"⚠️  Error parsing broadcast file: {e}")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
