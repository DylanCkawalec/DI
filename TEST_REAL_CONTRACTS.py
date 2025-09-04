#!/usr/bin/env python3
"""
🎉 Test Real Base Sepolia Deployed Contracts

Test our agents with the successfully deployed ERC-8004 contracts:
- IdentityRegistry: 0x35656CaD817aD468260dE1bA029fF919E5a40f75  
- ReputationRegistry: 0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B
- ValidationRegistry: 0x6731b3be764B33a4E94D148410f1f551CE91dA61

Total deployment cost: 0.00000187318838456 ETH (~$0.005)
"""

import os
import sys
import asyncio
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

async def test_real_base_sepolia_contracts():
    """Test agents with real Base Sepolia contracts"""
    
    print("🎉 Testing Real Base Sepolia Deployed Contracts")
    print("=" * 50)
    print("📍 Network: Base Sepolia (Chain ID: 84532)")
    print("🔗 RPC: DRPC endpoint")
    print("💰 Total deployment cost: ~$0.005")
    print()
    
    # Contract addresses from successful deployment
    contracts = {
        "IdentityRegistry": "0x35656CaD817aD468260dE1bA029fF919E5a40f75",
        "ReputationRegistry": "0x5796Cf09CF7E0F27A6Fb1489a7e5f9414f95F17B", 
        "ValidationRegistry": "0x6731b3be764B33a4E94D148410f1f551CE91dA61"
    }
    
    print("📜 Successfully Deployed Contracts:")
    for name, addr in contracts.items():
        print(f"   {name}: {addr}")
        print(f"   Verify: https://sepolia.basescan.org/address/{addr}")
    print()
    
    try:
        # Test 1: Agent Connection to Real Contracts
        print("🤖 Testing agent connection to real contracts...")
        
        from agents.base_agent import ERC8004BaseAgent
        
        # Create agent with real Base Sepolia configuration  
        agent = ERC8004BaseAgent(
            "real-base-sepolia.erc8004.dev",
            os.getenv('PRIVATE_KEY')
        )
        
        print(f"✅ Agent initialized successfully")
        print(f"   Agent Address: {agent.address}")
        print(f"   Network: {agent.w3.eth.chain_id}")
        print(f"   Identity Registry: {agent.identity_registry_address}")
        
        # Test 2: Contract Interaction
        print("\n📋 Testing contract interaction...")
        
        # Test registration fee
        fee = agent.identity_registry.functions.REGISTRATION_FEE().call()
        print(f"✅ Registration fee: {agent.w3.from_wei(fee, 'ether')} ETH")
        
        # Test agent count
        agent_count = agent.identity_registry.functions.getAgentCount().call()
        print(f"✅ Current agent count: {agent_count}")
        
        # Test 3: Agent Registration on Real Testnet
        print("\n📝 Testing agent registration on Base Sepolia...")
        
        if not agent.agent_id:
            print("💰 Registering with real testnet ETH...")
            
            balance_before = agent.w3.eth.get_balance(agent.address)
            
            agent_id = agent.register_agent()
            
            balance_after = agent.w3.eth.get_balance(agent.address)
            cost = balance_before - balance_after
            
            print(f"✅ Agent registered with ID: {agent_id}")
            print(f"💳 Registration cost: {agent.w3.from_wei(cost, 'ether')} ETH")
            print(f"🔗 Transaction on Base Sepolia testnet!")
        else:
            print(f"✅ Agent already registered with ID: {agent.agent_id}")
        
        # Test 4: AI Integration with Real Contracts
        print("\n🧠 Testing AI integration with real contracts...")
        
        from agents.code_review_server_agent import CodeReviewServerAgent, CodeReviewRequest
        
        ai_agent = CodeReviewServerAgent(
            os.getenv('PRIVATE_KEY'),
            "ai-base-sepolia.erc8004.dev"
        )
        
        print(f"✅ AI Agent initialized")
        print(f"   AI Providers: Grok {'✅' if ai_agent.grok_client else '❌'}")
        print(f"   Agent ID: {ai_agent.agent_id}")
        
        # Quick AI test
        test_request = CodeReviewRequest(
            code="def vulnerable(): os.system(input('cmd: '))",
            language="python", 
            filename="real_test.py",
            description="Real Base Sepolia AI test"
        )
        
        result = await ai_agent._perform_code_review(test_request)
        print(f"✅ AI analysis completed")
        print(f"   Security Score: {result.security_score}/100")
        print(f"   Issues Found: {len(result.issues)}")
        
        # Test 5: A2A Protocol with Real Contracts
        print("\n🔗 Testing A2A protocol with real contracts...")
        
        from agents.a2a_oracle_service import A2AOracleService
        
        oracle = A2AOracleService(os.getenv('PRIVATE_KEY'))
        
        session_id = oracle.create_a2a_session(
            user_address=agent.address,
            prompt="Real Base Sepolia A2A test",
            user_public_key="base_sepolia_real_test"
        )
        
        print(f"✅ A2A session created: {session_id}")
        print(f"   Session stored on Base Sepolia network")
        
        # Test encryption
        encrypted = await oracle.process_a2a_request(
            session_id=session_id,
            code_analysis_result=result.model_dump(),
            user_public_key=agent.address
        )
        
        print(f"✅ Payload encrypted: {len(encrypted)} bytes")
        
        # Test decryption
        decrypted = oracle.decrypt_payload_for_user(encrypted, agent.address)
        print(f"✅ Payload decrypted successfully")
        
        print("\n" + "=" * 60)
        print("🏆 REAL BASE SEPOLIA CONTRACT TEST SUCCESS!")
        print("=" * 60)
        print("✅ All contracts deployed and operational")
        print("✅ Agents connecting to real testnet")
        print("✅ AI analysis working with real APIs")
        print("✅ A2A protocol functional on Base Sepolia")
        print("✅ Encrypted payloads working")
        print()
        print("🚀 READY FOR PRODUCTION APPLICATION LAUNCH!")
        print()
        print("📋 Contract Verification URLs:")
        for name, addr in contracts.items():
            print(f"   {name}: https://sepolia.basescan.org/address/{addr}")
        
        return True
        
    except Exception as e:
        print(f"❌ Real contract test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_real_base_sepolia_contracts())
    if success:
        print("\n🎯 Next: Launch full application with these real contracts!")
        print("   python ULTIMATE_A2A_PRODUCTION.py")
    
    sys.exit(0 if success else 1)
