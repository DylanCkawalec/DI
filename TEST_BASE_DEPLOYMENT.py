#!/usr/bin/env python3
"""
🧪 Test Base Sepolia Deployment

Simple test to validate contract deployment to Base Sepolia works correctly
with the user's private key and DRPC endpoint.
"""

import os
import sys
import subprocess
from pathlib import Path
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

def test_base_sepolia_deployment():
    """Test deployment to Base Sepolia"""
    
    print("🧪 Testing Base Sepolia Deployment")
    print("=" * 40)
    
    # Check environment
    private_key = os.getenv('PRIVATE_KEY')
    rpc_url = os.getenv('BASE_SEPOLIA_RPC_URL', os.getenv('RPC_URL'))
    
    if not private_key:
        print("❌ PRIVATE_KEY not set in .env")
        return False
        
    if not rpc_url:
        print("❌ BASE_SEPOLIA_RPC_URL not set in .env")
        return False
    
    # Ensure private key format
    if not private_key.startswith('0x'):
        private_key = '0x' + private_key
    
    # Test network connection
    print("🌐 Testing Base Sepolia connection...")
    try:
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            raise Exception("Failed to connect to DRPC")
        
        account = Account.from_key(private_key)
        balance = w3.eth.get_balance(account.address)
        balance_eth = w3.from_wei(balance, 'ether')
        
        chain_id = w3.eth.chain_id
        latest_block = w3.eth.get_block('latest')
        
        print(f"✅ Connected to Base Sepolia")
        print(f"   Chain ID: {chain_id}")
        print(f"   Latest Block: #{latest_block.number}")
        print(f"   Account: {account.address}")
        print(f"   Balance: {balance_eth:.4f} ETH")
        
        if balance_eth < 0.01:
            print(f"⚠️  Low balance - may need more testnet ETH")
            print(f"   Get ETH from: https://docs.base.org/tools/network-faucets")
        
    except Exception as e:
        print(f"❌ Network test failed: {e}")
        return False
    
    # Test contract compilation
    print("\n🔨 Testing contract compilation...")
    try:
        os.chdir("contracts")
        
        compile_result = subprocess.run(["forge", "build"], capture_output=True, text=True)
        if compile_result.returncode == 0:
            print("✅ Contracts compiled successfully")
        else:
            print(f"❌ Compilation failed: {compile_result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Compilation test failed: {e}")
        return False
    finally:
        os.chdir("..")
    
    # Test dry run deployment (estimate gas, don't broadcast)
    print("\n📄 Testing deployment dry run...")
    try:
        os.chdir("contracts")
        
        # Set environment
        env = os.environ.copy()
        env['PRIVATE_KEY'] = private_key
        
        # Dry run (no --broadcast)
        deploy_result = subprocess.run([
            "forge", "script", "script/Deploy.s.sol:Deploy",
            "--rpc-url", rpc_url,
            "--sender", account.address,
            "-vvv"
        ], env=env, capture_output=True, text=True)
        
        if deploy_result.returncode == 0:
            print("✅ Deployment dry run successful")
            print("   Gas estimation completed")
            print("   Ready for real deployment")
            return True
        else:
            print(f"❌ Dry run failed: {deploy_result.stderr}")
            print(f"Stdout: {deploy_result.stdout}")
            return False
            
    except Exception as e:
        print(f"❌ Dry run failed: {e}")
        return False
    finally:
        os.chdir("..")

if __name__ == "__main__":
    success = test_base_sepolia_deployment()
    if success:
        print("\n🎉 Base Sepolia deployment test PASSED!")
        print("✅ Ready for real contract deployment")
    else:
        print("\n❌ Base Sepolia deployment test FAILED")
        print("🔧 Fix issues before attempting real deployment")
    
    sys.exit(0 if success else 1)
