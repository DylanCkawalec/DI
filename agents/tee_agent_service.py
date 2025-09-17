#!/usr/bin/env python3
"""
TEE-Enhanced Agent Service for ERC-8004 Trustless Agents
========================================================

This service integrates with Phala dstack TEE attestation and the enhanced
ERC-8004 contracts to provide cryptographically secure agent operations.

Features:
- Real TEE attestation via Phala dstack SDK
- ERC-8004 contract integration with TEE verification
- RA-TLS certificate handling for domain verification
- Automated trust score calculation
- DRPC blockchain integration for optimal performance
"""

import os
import sys
import json
import time
import uuid
import hashlib
import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timezone

import requests
import aiohttp
from web3 import Web3
from eth_account import Account
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization

# Phala dstack SDK imports
try:
    from dstack_sdk import DstackClient
    DSTACK_AVAILABLE = True
except ImportError:
    print("⚠️  dstack-sdk not available - using simulation mode")
    DSTACK_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class TEEAttestation:
    """TEE attestation data structure"""
    quote_data: bytes
    measurement_hash: str
    report_data: str
    timestamp: int
    verified: bool = False
    quote_hash: Optional[str] = None

@dataclass
class AgentInfo:
    """Enhanced agent information with TEE support"""
    agent_id: int
    domain: str
    address: str
    tee_measurement_hash: str
    domain_verified: bool
    root_pubkey_hash: str
    trust_weight: int = 10

class TEEAgentService:
    """TEE-Enhanced Agent Service with Phala integration"""
    
    def __init__(self):
        self.load_config()
        self.setup_blockchain()
        self.setup_tee_client()
        self.agent_info: Optional[AgentInfo] = None
        self.session = aiohttp.ClientSession()
        
    def load_config(self):
        """Load configuration from environment"""
        # Blockchain configuration
        self.rpc_url = os.getenv('RPC_URL')
        self.private_key = os.getenv('PRIVATE_KEY')
        self.chain_id = int(os.getenv('CHAIN_ID', '84532'))
        
        # TEE-Enhanced contract addresses (convert to checksum format)
        self.tee_verifier_address = Web3.to_checksum_address(os.getenv('TEE_VERIFIER_ADDRESS')) if os.getenv('TEE_VERIFIER_ADDRESS') else None
        self.identity_registry_address = Web3.to_checksum_address(os.getenv('IDENTITY_REGISTRY_ADDRESS')) if os.getenv('IDENTITY_REGISTRY_ADDRESS') else None
        self.reputation_registry_address = Web3.to_checksum_address(os.getenv('REPUTATION_REGISTRY_ADDRESS')) if os.getenv('REPUTATION_REGISTRY_ADDRESS') else None
        self.validation_registry_address = Web3.to_checksum_address(os.getenv('VALIDATION_REGISTRY_ADDRESS')) if os.getenv('VALIDATION_REGISTRY_ADDRESS') else None
        
        # Phala configuration
        self.phala_api_key = os.getenv('PHALA_API_KEY')
        self.phala_endpoint = os.getenv('PHALA_ENDPOINT', 'https://api.phala.network')
        self.phala_attestation_endpoint = os.getenv('PHALA_ATTESTATION_ENDPOINT')
        
        # Agent configuration
        self.agent_domain = os.getenv('AGENT_DOMAIN', f'agent-{uuid.uuid4().hex[:8]}.phala.app')
        self.agent_salt = os.getenv('SERVER_AGENT_SALT', 'tee_agent_salt_001')
        
        # Validate critical configuration
        required_vars = [
            'RPC_URL', 'PRIVATE_KEY', 'TEE_VERIFIER_ADDRESS', 
            'IDENTITY_REGISTRY_ADDRESS', 'PHALA_API_KEY'
        ]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {missing_vars}")

    def setup_blockchain(self):
        """Initialize blockchain connection via DRPC"""
        try:
            self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if not self.web3.is_connected():
                raise ConnectionError("Failed to connect to blockchain via DRPC")
                
            # Clean and validate private key
            clean_private_key = self.private_key
            if clean_private_key.startswith('0x'):
                clean_private_key = clean_private_key[2:]
                
            # Validate hex format
            if not all(c in '0123456789abcdefABCDEF' for c in clean_private_key):
                raise ValueError(f"Private key contains invalid characters")
                
            if len(clean_private_key) != 64:
                raise ValueError(f"Private key wrong length: {len(clean_private_key)} (expected 64)")
                
            self.account = Account.from_key(clean_private_key)
            self.web3.eth.default_account = self.account.address
            
            logger.info(f"✅ Connected to blockchain via DRPC - Chain ID: {self.chain_id}")
            logger.info(f"✅ Agent address: {self.account.address}")
            
            # Load contract ABIs and create contract instances
            self.load_contracts()
            
        except Exception as e:
            logger.error(f"❌ Blockchain setup failed: {e}")
            raise

    def load_contracts(self):
        """Load TEE-enhanced contract instances"""
        # Simplified ABIs for key functions
        identity_abi = [
            {
                "inputs": [{"name": "domain", "type": "string"}, {"name": "agentAddress", "type": "address"}, 
                          {"name": "measurementHash", "type": "bytes32"}, {"name": "attestationProof", "type": "bytes"}],
                "name": "newAgentWithTEE",
                "outputs": [{"name": "agentId", "type": "uint256"}],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [{"name": "agentId", "type": "uint256"}],
                "name": "getAgent",
                "outputs": [{"components": [{"name": "agentId", "type": "uint256"}, {"name": "agentDomain", "type": "string"}, 
                           {"name": "agentAddress", "type": "address"}, {"name": "teeMeasurementHash", "type": "bytes32"},
                           {"name": "domainVerified", "type": "bool"}, {"name": "rootPubKeyHash", "type": "bytes32"}], 
                           "name": "agentInfo", "type": "tuple"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "REGISTRATION_FEE",
                "outputs": [{"name": "fee", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        tee_verifier_abi = [
            {
                "inputs": [{"name": "quoteData", "type": "bytes"}, {"name": "expectedReportData", "type": "bytes32"}, 
                          {"name": "maxAge", "type": "uint256"}],
                "name": "verifyTEEQuote",
                "outputs": [{"name": "verified", "type": "bool"}, {"name": "measurementHash", "type": "bytes32"}, 
                           {"name": "quoteHash", "type": "bytes32"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTrustedMeasurements",
                "outputs": [{"components": [{"name": "measurementHash", "type": "bytes32"}, {"name": "description", "type": "string"},
                           {"name": "addedAt", "type": "uint256"}, {"name": "active", "type": "bool"}],
                           "name": "measurements", "type": "tuple[]"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        reputation_abi = [
            {
                "inputs": [{"name": "agentClientId", "type": "uint256"}, {"name": "agentServerId", "type": "uint256"},
                          {"name": "requireTEE", "type": "bool"}],
                "name": "acceptTEEFeedback",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "agentClientId", "type": "uint256"}, {"name": "agentServerId", "type": "uint256"}],
                "name": "calculateFeedbackWeight",
                "outputs": [{"name": "weight", "type": "uint256"}, {"name": "teeVerified", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        # Create contract instances
        self.identity_contract = self.web3.eth.contract(
            address=self.identity_registry_address,
            abi=identity_abi
        )
        
        self.tee_verifier_contract = self.web3.eth.contract(
            address=self.tee_verifier_address,
            abi=tee_verifier_abi
        )
        
        self.reputation_contract = self.web3.eth.contract(
            address=self.reputation_registry_address,
            abi=reputation_abi
        )
        
        logger.info("✅ TEE-enhanced contracts loaded successfully")

    def setup_tee_client(self):
        """Initialize Phala dstack TEE client"""
        self.tee_client = None
        self.tee_available = False
        
        if not DSTACK_AVAILABLE:
            logger.warning("⚠️  Phala dstack SDK not available - using simulation mode")
            return
            
        try:
            # Try to connect to dstack socket
            self.tee_client = DstackClient()
            
            # Test connection by getting TEE info
            tee_info = self.tee_client.info()
            if tee_info:
                self.tee_available = True
                logger.info("✅ Phala dstack TEE client initialized successfully")
                logger.info(f"✅ TEE Environment: {tee_info.get('version', 'unknown')}")
            else:
                logger.warning("⚠️  TEE client connected but no info available")
                
        except Exception as e:
            logger.warning(f"⚠️  TEE client initialization failed: {e}")
            logger.info("   Continuing in simulation mode...")

    async def generate_tee_attestation(self) -> Optional[TEEAttestation]:
        """Generate TEE attestation using Phala dstack SDK (following validation.txt specs)"""
        if not self.tee_available or not self.tee_client:
            return await self.simulate_tee_attestation()
            
        try:
            logger.info("🔐 Generating real TEE attestation using Phala dstack...")
            
            # 1. Get TEE info first (MR TD, RTMRs, compose hash, etc.)
            tee_info = self.tee_client.info()
            logger.info(f"✅ TEE Info retrieved - Version: {tee_info.get('version', 'unknown')}")
            
            # 2. Create report data following validation.txt spec
            report_data_content = {
                "v": 1,
                "domain": self.agent_domain,
                "address": self.account.address,
                "commit": "tee-agent-v1.0.0",  # Version identifier
                "model": f"sha256:{hashlib.sha256(b'erc8004-agent-model').hexdigest()}",
                "nonce": str(uuid.uuid4()),
                "ts": int(time.time())
            }
            
            report_data_json = json.dumps(report_data_content, sort_keys=True)
            logger.info(f"📝 Report data prepared: {report_data_json}")
            
            # 3. Get TEE quote with bound report data
            quote = self.tee_client.get_quote(report_data_json.encode('utf-8'))
            
            if not quote:
                raise Exception("Failed to get TEE quote from dstack")
            
            logger.info(f"✅ TEE quote generated successfully - Size: {len(quote)} bytes")
            
            # 4. Generate deterministic EVM key for the agent (lives inside TEE)
            agent_key = self.tee_client.get_key('erc8004/agent-wallet', 'ethereum')
            logger.info(f"🔑 TEE-derived agent key generated")
            
            # 5. Optional: Get RA-TLS server cert for API (embeds TDX quote in X.509 ext)
            try:
                tls_cert = self.tee_client.get_tls_key(
                    subject=self.agent_domain,
                    alt_names=[self.agent_domain],
                    usage_ra_tls=True
                )
                logger.info(f"🔒 RA-TLS certificate generated for domain: {self.agent_domain}")
            except Exception as tls_error:
                logger.warning(f"⚠️ RA-TLS certificate generation failed: {tls_error}")
            
            # Calculate actual measurement hash from TEE info
            measurement_components = [
                tee_info.get('mrtd', ''),
                tee_info.get('rtmr0', ''),
                tee_info.get('rtmr1', ''),
                tee_info.get('rtmr2', ''),
                tee_info.get('rtmr3', '')
            ]
            measurement_hash = hashlib.sha256(
                ''.join(measurement_components).encode('utf-8')
            ).hexdigest()
            
            attestation = TEEAttestation(
                quote_data=quote,
                measurement_hash=f"0x{measurement_hash}",
                report_data=Web3.keccak(text=report_data_json).hex(),
                timestamp=int(time.time()),
                verified=True
            )
            
            logger.info(f"✅ Real TEE attestation generated - Measurement: {attestation.measurement_hash[:10]}...")
            logger.info(f"   Report data hash: {attestation.report_data}")
            return attestation
            
        except Exception as e:
            logger.error(f"❌ TEE attestation generation failed: {e}")
            logger.info("   Falling back to simulation mode...")
            return await self.simulate_tee_attestation()

    async def simulate_tee_attestation(self) -> TEEAttestation:
        """Simulate TEE attestation for demo purposes"""
        logger.info("🔧 Generating simulated TEE attestation for demo...")
        
        # Create mock report data
        report_data_content = {
            "domain": self.agent_domain,
            "address": self.account.address,
            "timestamp": int(time.time()),
            "nonce": str(uuid.uuid4())
        }
        
        report_data_json = json.dumps(report_data_content, sort_keys=True)
        
        # Generate mock quote data (256 bytes)
        quote_data = os.urandom(256)
        
        # Use a demo measurement hash
        measurement_hash = hashlib.sha256(b"demo-tee-measurement-v1.0.0").hexdigest()
        
        return TEEAttestation(
            quote_data=quote_data,
            measurement_hash=f"0x{measurement_hash}",
            report_data=Web3.keccak(text=report_data_json).hex(),
            timestamp=int(time.time()),
            verified=True  # Simulated as verified
        )

    async def register_tee_agent(self) -> Optional[int]:
        """Register agent with TEE attestation on blockchain"""
        try:
            logger.info("🔐 Starting TEE agent registration...")
            
            # Generate TEE attestation
            attestation = await self.generate_tee_attestation()
            if not attestation:
                raise Exception("Failed to generate TEE attestation")
            
            # Get registration fee
            registration_fee = self.identity_contract.functions.REGISTRATION_FEE().call()
            logger.info(f"💰 Registration fee: {Web3.from_wei(registration_fee, 'ether')} ETH")
            
            # Build transaction
            tx = self.identity_contract.functions.newAgentWithTEE(
                self.agent_domain,
                self.account.address,
                attestation.measurement_hash,
                attestation.quote_data
            ).build_transaction({
                'from': self.account.address,
                'value': registration_fee,
                'gas': 500000,
                'gasPrice': Web3.to_wei('20', 'gwei'),
                'nonce': self.web3.eth.get_transaction_count(self.account.address)
            })
            
            # Sign and send transaction
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            logger.info(f"📡 Transaction sent: {tx_hash.hex()}")
            
            # Wait for receipt
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                # Extract agent ID from logs
                agent_id = self.extract_agent_id_from_receipt(receipt)
                if agent_id:
                    logger.info(f"✅ TEE Agent registered successfully! Agent ID: {agent_id}")
                    await self.load_agent_info(agent_id)
                    return agent_id
                else:
                    logger.error("❌ Failed to extract agent ID from transaction receipt")
                    return None
            else:
                logger.error(f"❌ Registration transaction failed - Status: {receipt.status}")
                return None
                
        except Exception as e:
            logger.error(f"❌ TEE agent registration failed: {e}")
            return None

    def extract_agent_id_from_receipt(self, receipt) -> Optional[int]:
        """Extract agent ID from transaction receipt"""
        try:
            # Look for AgentRegistered event
            for log in receipt.logs:
                if log.address.lower() == self.identity_registry_address.lower():
                    # Decode the first topic as agent ID (simplified)
                    if len(log.topics) >= 2:
                        agent_id = int(log.topics[1].hex(), 16)
                        return agent_id
            return None
        except Exception as e:
            logger.error(f"Failed to extract agent ID: {e}")
            return None

    async def load_agent_info(self, agent_id: int):
        """Load agent information from blockchain"""
        try:
            agent_data = self.identity_contract.functions.getAgent(agent_id).call()
            
            self.agent_info = AgentInfo(
                agent_id=agent_data[0],
                domain=agent_data[1],
                address=agent_data[2],
                tee_measurement_hash=agent_data[3].hex() if agent_data[3] else "0x",
                domain_verified=agent_data[4],
                root_pubkey_hash=agent_data[5].hex() if agent_data[5] else "0x"
            )
            
            # Calculate trust weight
            await self.calculate_trust_weight()
            
            logger.info(f"✅ Agent info loaded - Trust Weight: {self.agent_info.trust_weight}%")
            
        except Exception as e:
            logger.error(f"❌ Failed to load agent info: {e}")

    async def calculate_trust_weight(self):
        """Calculate agent trust weight based on verification status"""
        if not self.agent_info:
            return
            
        # Base weight
        weight = 10
        
        # TEE attestation bonus
        if self.agent_info.tee_measurement_hash and self.agent_info.tee_measurement_hash != "0x":
            weight += 40
            
        # Domain verification bonus
        if self.agent_info.domain_verified:
            weight += 30
            
        # Full verification bonus
        if (self.agent_info.tee_measurement_hash and 
            self.agent_info.tee_measurement_hash != "0x" and 
            self.agent_info.domain_verified):
            weight += 20
            
        self.agent_info.trust_weight = min(weight, 100)

    async def verify_phala_attestation(self, quote_data: bytes) -> Optional[Dict[str, Any]]:
        """Verify attestation via Phala API following validation.txt spec"""
        if not self.phala_attestation_endpoint:
            logger.warning("⚠️  Phala attestation endpoint not configured")
            return None
            
        try:
            logger.info("📡 Verifying TEE attestation via Phala API...")
            
            # Upload quote to Phala attestation API
            url = f"{self.phala_attestation_endpoint}/verify"
            
            # Convert quote_data to hex if it's bytes
            quote_hex = quote_data.hex() if isinstance(quote_data, bytes) else quote_data
            
            # POST to Phala API - can upload as file or hex
            headers = {'Content-Type': 'application/json'}
            payload = {'quote_hex': quote_hex}
            
            async with self.session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get('success'):
                        checksum = data.get('checksum')
                        logger.info(f"✅ Phala attestation verified - Checksum: {checksum}")
                        
                        # Get detailed quote information
                        if checksum:
                            view_url = f"{self.phala_attestation_endpoint}/view/{checksum}"
                            async with self.session.get(view_url) as view_response:
                                if view_response.status == 200:
                                    quote_details = await view_response.json()
                                    logger.info("✅ Quote details retrieved from Phala")
                                    
                                    return {
                                        'success': True,
                                        'checksum': checksum,
                                        'quote_details': quote_details,
                                        'mrtd': quote_details.get('mrtd'),
                                        'rtmr0': quote_details.get('rtmr0'),
                                        'rtmr1': quote_details.get('rtmr1'),
                                        'rtmr2': quote_details.get('rtmr2'),
                                        'rtmr3': quote_details.get('rtmr3'),
                                        'report_data': quote_details.get('report_data'),
                                        'uploaded_at': data.get('uploaded_at')
                                    }
                        
                        return data
                    else:
                        logger.error(f"❌ Phala attestation verification failed: {data.get('error', 'Unknown error')}")
                        return None
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Phala API error - Status: {response.status}, Error: {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Phala API request failed: {e}")
            return None

    async def get_app_attestation_from_phala(self, app_id: str) -> Optional[Dict[str, Any]]:
        """Get app attestation bundle via Phala CLI/API"""
        try:
            # This would typically use the Phala CLI: phala cvms attestation <app_id>
            # For now, we'll use the API equivalent
            
            logger.info(f"📡 Fetching attestation for app ID: {app_id}")
            
            # Use Phala API to get recent attestations and find ours
            url = f"{self.phala_attestation_endpoint}/recent?limit=10"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    attestations = data.get('attestations', [])
                    
                    # Find attestation matching our app criteria
                    for attestation in attestations:
                        quote_details = attestation.get('quote', {})
                        report_data = quote_details.get('report_data', '')
                        
                        # Check if report_data contains our app_id or domain
                        if app_id in report_data or self.agent_domain in report_data:
                            logger.info(f"✅ Found matching attestation: {attestation.get('checksum')}")
                            return attestation
                    
                    logger.warning(f"⚠️ No matching attestation found for app ID: {app_id}")
                    return None
                else:
                    logger.error(f"❌ Failed to fetch recent attestations - Status: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ App attestation fetch failed: {e}")
            return None

    async def get_trusted_measurements(self) -> List[Dict[str, Any]]:
        """Get trusted measurements from TEE verifier contract"""
        try:
            measurements = self.tee_verifier_contract.functions.getTrustedMeasurements().call()
            
            trusted_measurements = []
            for measurement in measurements:
                trusted_measurements.append({
                    'measurement_hash': measurement[0].hex(),
                    'description': measurement[1],
                    'added_at': measurement[2],
                    'active': measurement[3]
                })
                
            logger.info(f"✅ Retrieved {len(trusted_measurements)} trusted measurements")
            return trusted_measurements
            
        except Exception as e:
            logger.error(f"❌ Failed to get trusted measurements: {e}")
            return []

    async def start_service(self):
        """Start the TEE agent service"""
        logger.info("🚀 Starting TEE-Enhanced Agent Service")
        logger.info("=" * 50)
        
        try:
            # Register agent with TEE attestation
            agent_id = await self.register_tee_agent()
            
            if not agent_id:
                logger.error("❌ Failed to register TEE agent - Service cannot start")
                return False
                
            # Get trusted measurements
            await self.get_trusted_measurements()
            
            logger.info("✅ TEE Agent Service started successfully!")
            logger.info(f"✅ Agent ID: {agent_id}")
            logger.info(f"✅ Domain: {self.agent_domain}")
            logger.info(f"✅ Trust Weight: {self.agent_info.trust_weight if self.agent_info else 'Unknown'}%")
            logger.info(f"✅ TEE Available: {'Yes' if self.tee_available else 'Simulation Mode'}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Service startup failed: {e}")
            return False

    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()

async def main():
    """Main entry point"""
    service = TEEAgentService()
    
    try:
        success = await service.start_service()
        
        if success:
            logger.info("🔐 TEE Agent Service is running...")
            logger.info("Press Ctrl+C to stop")
            
            # Keep service running
            while True:
                await asyncio.sleep(30)
                logger.info(f"💚 Service heartbeat - Agent ID: {service.agent_info.agent_id if service.agent_info else 'N/A'}")
                
    except KeyboardInterrupt:
        logger.info("🛑 Shutdown signal received")
    except Exception as e:
        logger.error(f"❌ Service error: {e}")
    finally:
        await service.cleanup()
        logger.info("✅ Service stopped gracefully")

if __name__ == "__main__":
    asyncio.run(main())
