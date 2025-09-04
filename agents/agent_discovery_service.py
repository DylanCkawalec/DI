#!/usr/bin/env python3
"""
🔍 ERC-8004 Agent Discovery Service

This service handles on-chain agent discovery and A2A protocol communication.
It enables agents to find, verify, and interact with each other trustlessly.
"""

import os
import sys
import json
import asyncio
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from web3 import Web3
from eth_account import Account

@dataclass
class DiscoveredAgent:
    """Represents a discovered ERC-8004 agent"""
    agent_id: int
    domain: str
    address: str
    agent_type: str
    services: List[str]
    reputation: int
    trust_score: int
    last_active: datetime
    is_online: bool
    contract_address: str
    agent_card_url: str

class AgentDiscoveryService:
    """Service for discovering and communicating with ERC-8004 agents"""
    
    def __init__(self, web3_instance: Web3, identity_registry_address: str):
        self.w3 = web3_instance
        self.identity_registry_address = identity_registry_address
        self.discovered_agents: Dict[int, DiscoveredAgent] = {}
        
        # Load identity registry contract ABI
        self.identity_registry = self._load_identity_contract()
        
        print("🔍 Agent Discovery Service initialized")
        print(f"   Identity Registry: {identity_registry_address}")
        print(f"   Network: {self.w3.eth.chain_id}")
    
    def _load_identity_contract(self):
        """Load the IdentityRegistry contract"""
        try:
            # Load ABI from compiled artifacts
            abi_path = "contracts/out/IdentityRegistry.sol/IdentityRegistry.json"
            with open(abi_path, 'r') as f:
                artifact = json.load(f)
            
            return self.w3.eth.contract(
                address=self.identity_registry_address,
                abi=artifact['abi']
            )
        except Exception as e:
            print(f"⚠️ Could not load IdentityRegistry contract: {e}")
            return None
    
    async def discover_agents_on_chain(self) -> List[DiscoveredAgent]:
        """Discover all registered agents on the blockchain"""
        
        print("🔍 Starting on-chain agent discovery...")
        discovered = []
        
        try:
            if not self.identity_registry:
                print("❌ Identity registry not available")
                return []
            
            # Get total number of registered agents
            try:
                agent_count = self.identity_registry.functions.agentCount().call()
                print(f"   📊 Total registered agents: {agent_count}")
            except Exception as e:
                print(f"⚠️ Could not get agent count: {e}")
                agent_count = 10  # Default scan range
            
            # Scan for registered agents
            for agent_id in range(1, min(agent_count + 1, 100)):  # Limit to first 100 agents
                try:
                    # Get agent info from contract
                    agent_info = self.identity_registry.functions.getAgent(agent_id).call()
                    
                    if agent_info[1]:  # If domain is not empty
                        domain = agent_info[1]
                        address = agent_info[2]
                        
                        print(f"   🔍 Found agent {agent_id}: {domain}")
                        
                        # Verify agent by fetching AgentCard
                        agent_details = await self._verify_agent_card(agent_id, domain, address)
                        
                        if agent_details:
                            discovered.append(agent_details)
                            self.discovered_agents[agent_id] = agent_details
                        
                except Exception as e:
                    # Agent not found or error - continue scanning
                    continue
            
            print(f"✅ Agent discovery complete: {len(discovered)} agents found")
            return discovered
            
        except Exception as e:
            print(f"❌ Agent discovery failed: {e}")
            return []
    
    async def _verify_agent_card(self, agent_id: int, domain: str, address: str) -> Optional[DiscoveredAgent]:
        """Verify agent by fetching and validating its AgentCard"""
        
        try:
            # Construct AgentCard URL
            agent_card_url = f"https://{domain}/.well-known/agent-card.json"
            
            # Attempt to fetch AgentCard
            response = requests.get(agent_card_url, timeout=10)
            
            if response.status_code == 200:
                agent_card = response.json()
                
                # Validate AgentCard structure
                if self._validate_agent_card(agent_card, agent_id, domain, address):
                    
                    # Check if agent is online
                    is_online = await self._check_agent_online(agent_card.get('api_endpoint'))
                    
                    return DiscoveredAgent(
                        agent_id=agent_id,
                        domain=domain,
                        address=address,
                        agent_type=agent_card.get('agent_type', 'unknown'),
                        services=agent_card.get('services', []),
                        reputation=agent_card.get('reputation', 50),
                        trust_score=agent_card.get('trust_score', 50),
                        last_active=datetime.now(),
                        is_online=is_online,
                        contract_address=self.identity_registry_address,
                        agent_card_url=agent_card_url
                    )
                else:
                    print(f"   ❌ Invalid AgentCard for {domain}")
            
            else:
                print(f"   ⚠️ AgentCard not accessible for {domain}: {response.status_code}")
                
        except Exception as e:
            print(f"   ⚠️ Could not verify agent {domain}: {e}")
        
        return None
    
    def _validate_agent_card(self, card: Dict[str, Any], agent_id: int, domain: str, address: str) -> bool:
        """Validate AgentCard structure and authenticity"""
        
        required_fields = ['agent_id', 'agent_type', 'services', 'api_endpoint']
        
        # Check required fields
        for field in required_fields:
            if field not in card:
                return False
        
        # Verify agent ID matches
        if card['agent_id'] != agent_id:
            return False
        
        # Verify domain matches
        if card.get('domain') != domain:
            return False
        
        # Verify address matches (if provided)
        if card.get('address') and card['address'].lower() != address.lower():
            return False
        
        return True
    
    async def _check_agent_online(self, api_endpoint: str) -> bool:
        """Check if agent is currently online"""
        
        if not api_endpoint:
            return False
        
        try:
            # Try to reach agent's health endpoint
            health_url = f"{api_endpoint.rstrip('/')}/health"
            response = requests.get(health_url, timeout=5)
            
            return response.status_code == 200
            
        except Exception:
            return False
    
    async def initiate_a2a_communication(self, target_agent_id: int, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initiate A2A communication with a discovered agent"""
        
        if target_agent_id not in self.discovered_agents:
            return {"error": "Agent not discovered", "agent_id": target_agent_id}
        
        target_agent = self.discovered_agents[target_agent_id]
        
        if not target_agent.is_online:
            return {"error": "Target agent offline", "agent_id": target_agent_id}
        
        try:
            print(f"🔗 Initiating A2A communication with agent {target_agent_id}")
            
            # Prepare A2A request
            a2a_request = {
                "protocol": "ERC-8004-A2A",
                "version": "1.0.0",
                "source_agent": {
                    "agent_id": 999,  # Our agent ID
                    "domain": "demo-server.erc8004.dev",
                    "timestamp": datetime.now().isoformat()
                },
                "target_agent": {
                    "agent_id": target_agent.agent_id,
                    "domain": target_agent.domain
                },
                "request_data": request_data,
                "signature": self._sign_a2a_request(request_data)
            }
            
            # Send A2A request to target agent
            api_endpoint = f"https://{target_agent.domain}/api/a2a/receive"
            
            response = requests.post(
                api_endpoint,
                json=a2a_request,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ A2A communication successful with agent {target_agent_id}")
                return {
                    "success": True,
                    "agent_id": target_agent_id,
                    "response": result,
                    "communication_time": datetime.now().isoformat()
                }
            else:
                print(f"❌ A2A communication failed: {response.status_code}")
                return {
                    "error": f"HTTP {response.status_code}",
                    "agent_id": target_agent_id
                }
                
        except Exception as e:
            print(f"❌ A2A communication error: {e}")
            return {"error": str(e), "agent_id": target_agent_id}
    
    def _sign_a2a_request(self, request_data: Dict[str, Any]) -> str:
        """Sign A2A request for authenticity verification"""
        
        try:
            # Create message to sign
            message_data = {
                "request_data": request_data,
                "timestamp": datetime.now().isoformat()
            }
            
            message_str = json.dumps(message_data, sort_keys=True)
            
            # Sign with agent's private key
            private_key = os.getenv('PRIVATE_KEY')
            if private_key:
                account = Account.from_key(private_key)
                
                # Sign the message
                from eth_account.messages import encode_defunct
                message = encode_defunct(text=message_str)
                signature = account.sign_message(message)
                
                return signature.signature.hex()
            
            return "unsigned"
            
        except Exception as e:
            print(f"⚠️ A2A request signing failed: {e}")
            return "signing_failed"
    
    def get_network_statistics(self) -> Dict[str, Any]:
        """Get current network statistics"""
        
        total_agents = len(self.discovered_agents)
        online_agents = sum(1 for agent in self.discovered_agents.values() if agent.is_online)
        total_interactions = sum(agent.total_interactions for agent in self.discovered_agents.values())
        
        # Calculate network effects
        network_value = total_interactions * 0.0005  # Approximate ETH value
        
        # Agent type distribution
        type_distribution = {}
        for agent in self.discovered_agents.values():
            type_distribution[agent.agent_type] = type_distribution.get(agent.agent_type, 0) + 1
        
        return {
            "total_agents": total_agents,
            "online_agents": online_agents,
            "total_interactions": total_interactions,
            "network_value_eth": round(network_value, 6),
            "agent_types": type_distribution,
            "discovery_timestamp": datetime.now().isoformat(),
            "network_health": (online_agents / max(total_agents, 1)) * 100
        }

# Global discovery service instance
discovery_service = None

def get_discovery_service(web3_instance: Web3, identity_registry: str) -> AgentDiscoveryService:
    """Get global discovery service instance"""
    global discovery_service
    
    if discovery_service is None:
        discovery_service = AgentDiscoveryService(web3_instance, identity_registry)
    
    return discovery_service

if __name__ == "__main__":
    # Test agent discovery
    async def test_discovery():
        # Initialize Web3 connection
        w3 = Web3(Web3.HTTPProvider('https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IileqhnKxixj'))
        
        # Create discovery service
        discovery = AgentDiscoveryService(
            w3, 
            '0x35656CaD817aD468260dE1bA029fF919E5a40f75'
        )
        
        # Discover agents
        agents = await discovery.discover_agents_on_chain()
        
        print(f"\n🎉 Discovery Results:")
        print(f"   Agents found: {len(agents)}")
        
        for agent in agents:
            print(f"   • {agent.domain} (ID: {agent.agent_id}) - {agent.agent_type}")
        
        # Get network stats
        stats = discovery.get_network_statistics()
        print(f"\n📊 Network Statistics:")
        print(f"   Total agents: {stats['total_agents']}")
        print(f"   Online agents: {stats['online_agents']}")
        print(f"   Network health: {stats['network_health']:.1f}%")
    
    asyncio.run(test_discovery())
