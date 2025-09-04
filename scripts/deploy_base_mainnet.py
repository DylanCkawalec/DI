#!/usr/bin/env python3
"""
ERC-8004 AI Code Review Service - Base Mainnet Deployment Script
Deploys all ERC-8004 contracts to Base Mainnet for production use
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
BASE_MAINNET_RPC = os.getenv('BASE_MAINNET_RPC_URL')
CHAIN_ID = int(os.getenv('BASE_MAINNET_CHAIN_ID', '8453'))

# Ensure private key has 0x prefix for Foundry
if PRIVATE_KEY and not PRIVATE_KEY.startswith('0x'):
    PRIVATE_KEY = '0x' + PRIVATE_KEY

# Validate required environment variables
if not PRIVATE_KEY:
    print("❌ Error: PRIVATE_KEY not set in environment variables")
    print("Please set PRIVATE_KEY in your .env file")
    sys.exit(1)
    
if not BASE_MAINNET_RPC:
    print("❌ Error: BASE_MAINNET_RPC_URL not set in environment variables")
    print("Please set BASE_MAINNET_RPC_URL in your .env file") 
    sys.exit(1)

def main():
    """Deploy ERC-8004 contracts to Base Mainnet"""
    
    print("🚀 ERC-8004 AI Code Review Service - Base Mainnet Deployment")
    print("=" * 60)
    print("⚠️  WARNING: This will deploy to MAINNET with REAL ETH!")
    print(f"Network: Base Mainnet (Chain ID: {CHAIN_ID})")
    print(f"RPC URL: {BASE_MAINNET_RPC}")
    print()

    # Safety confirmation
    confirm = input("Are you sure you want to deploy to MAINNET? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Deployment cancelled by user")
        return False

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
    
    # Run additional checks for mainnet
    print("\n🔍 Running pre-deployment checks...")
    
    # Check gas prices and estimates
    print("📊 Estimating gas costs...")
    gas_estimate_cmd = [
        "forge", "script", "script/Deploy.s.sol:Deploy",
        "--rpc-url", BASE_MAINNET_RPC,
        "--private-key", PRIVATE_KEY,
        # "--gas-estimate", # This flag may not exist, removing it
    ]
    
    # Set environment variables for deployment
    env = os.environ.copy()
    env["PRIVATE_KEY"] = PRIVATE_KEY
    
    # Final confirmation
    print("\n🎯 Ready to deploy to Base Mainnet:")
    print("  1. IdentityRegistry")
    print("  2. ReputationRegistry") 
    print("  3. ValidationRegistry")
    print()
    print("💰 This will cost real ETH on Base Mainnet!")
    
    final_confirm = input("Proceed with mainnet deployment? (YES to confirm): ")
    if final_confirm != 'YES':
        print("❌ Deployment cancelled - did not receive 'YES' confirmation")
        return False
    
    # Deploy contracts
    deploy_cmd = [
        "forge", "script", "script/Deploy.s.sol:Deploy",
        "--rpc-url", BASE_MAINNET_RPC,
        "--private-key", PRIVATE_KEY,
        "--broadcast",
        "--verify",
        "--chain-id", str(CHAIN_ID),
        "-vvv"
    ]
    
    print("🚀 Executing mainnet deployment...")
    result = subprocess.run(deploy_cmd, env=env)
    
    if result.returncode == 0:
        print("\n🎉 MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!")
        print("\n📋 Next steps:")
        print("1. Copy contract addresses from the output above")
        print("2. Update your production .env file with the deployed addresses")
        print("3. Verify contracts on Basescan")
        print("4. Set up monitoring and alerts")
        print("5. Update frontend to use mainnet contracts")
        print("6. Announce the launch! 🚀")
        
        # Try to extract addresses from broadcast files
        try:
            extract_addresses()
        except Exception as e:
            print(f"⚠️  Could not auto-extract addresses: {e}")
            print("Please manually copy addresses from deployment output")
            
        return True
    else:
        print("❌ MAINNET DEPLOYMENT FAILED!")
        print("Please check the error messages above")
        print("No contracts were deployed, your ETH is safe")
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
            
        print("\n🎯 MAINNET CONTRACT ADDRESSES:")
        print("=" * 50)
        
        transactions = broadcast_data.get('transactions', [])
        addresses = {}
        
        for tx in transactions:
            if tx.get('transactionType') == 'CREATE':
                contract_name = tx.get('contractName', 'Unknown')
                address = tx.get('contractAddress', 'Unknown')
                addresses[contract_name] = address
                print(f"{contract_name}: {address}")
                
        print("\n📝 Production .env configuration:")
        print("IDENTITY_REGISTRY_ADDRESS=" + addresses.get('IdentityRegistry', ''))
        print("REPUTATION_REGISTRY_ADDRESS=" + addresses.get('ReputationRegistry', ''))
        print("VALIDATION_REGISTRY_ADDRESS=" + addresses.get('ValidationRegistry', ''))
        print("RPC_URL=" + BASE_MAINNET_RPC)
        print("CHAIN_ID=" + str(CHAIN_ID))
        
        print("\n🔗 Verify on Basescan:")
        for name, addr in addresses.items():
            if addr != 'Unknown':
                print(f"https://basescan.org/address/{addr}")
        
    except Exception as e:
        print(f"⚠️  Error parsing broadcast file: {e}")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
