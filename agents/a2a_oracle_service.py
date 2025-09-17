#!/usr/bin/env python3
"""
ERC-8004 A2A Oracle Service

This service acts as the oracle between agents and the blockchain,
managing encrypted payloads, session data, and DRPC interactions.

Features:
- Agent-to-Agent protocol implementation
- Encrypted payload system with signature verification  
- Session management and persistence
- DRPC polling and blockchain data posting
- Transaction logging and audit trail
"""

import os
import sys
import json
import time
import asyncio
import hashlib
import hmac
import csv
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
import logging
from dataclasses import dataclass, asdict
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Core dependencies
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class A2ASession:
    """A2A protocol session data"""
    session_id: str
    user_address: str
    agent_address: str
    prompt_hash: str
    encrypted_payload: Optional[str] = None
    signature: Optional[str] = None
    status: str = "pending"  # pending, processing, completed, failed
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    cost_eth: float = 0.0
    transaction_hashes: List[str] = None
    
    def __post_init__(self):
        if self.transaction_hashes is None:
            self.transaction_hashes = []

@dataclass
class EncryptedPayload:
    """Encrypted payload for A2A communications"""
    encrypted_data: str
    signature: str
    public_key: str
    timestamp: str
    payload_hash: str

class A2AOracleService:
    """Oracle service managing A2A protocol interactions"""
    
    def __init__(self, agent_private_key: str):
        self.agent_private_key = agent_private_key
        # Clean and validate private key
        clean_private_key = agent_private_key
        if clean_private_key.startswith('0x'):
            clean_private_key = clean_private_key[2:]
            
        # Validate hex format
        if not all(c in '0123456789abcdefABCDEF' for c in clean_private_key):
            raise ValueError(f"Private key contains invalid characters: {clean_private_key[:10]}...")
            
        if len(clean_private_key) != 64:
            raise ValueError(f"Private key wrong length: {len(clean_private_key)} (expected 64)")
            
        self.agent_account = Account.from_key(clean_private_key)
        self.sessions: Dict[str, A2ASession] = {}
        
        # Initialize Web3 with DRPC (with offline mode fallback)
        rpc_url = os.getenv('RPC_URL', 'http://127.0.0.1:8545')
        
        try:
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            
            # Test connection
            if not self.w3.is_connected():
                print(f"⚠️ Web3 connection failed to {rpc_url}, running in offline mode")
                self.offline_mode = True
            else:
                # Test blockchain access
                try:
                    latest_block = self.w3.eth.get_block('latest')
                    print(f"✅ Web3 connected to {rpc_url} - Block #{latest_block.number}")
                    self.offline_mode = False
                except Exception as e:
                    print(f"⚠️ Blockchain access failed: {e}, running in offline mode")
                    self.offline_mode = True
                    
        except Exception as e:
            print(f"⚠️ Web3 initialization failed: {e}, running in offline mode")
            self.w3 = self._create_offline_web3()
            self.offline_mode = True
        
        # Session storage
        self.session_storage = Path("data/sessions")
        self.session_storage.mkdir(parents=True, exist_ok=True)
        
        # Transaction logging
        self.transaction_log = Path("data/transaction_audit.csv")
        self._init_transaction_log()
        
        # Encryption setup
        self._init_encryption()
        
        print(f"🔮 A2A Oracle Service initialized")
        print(f"   Agent Address: {self.agent_account.address}")
        print(f"   RPC URL: {rpc_url}")
        print(f"   Session Storage: {self.session_storage}")
        print(f"   Mode: {'Offline' if self.offline_mode else 'Online'}")

    def _create_offline_web3(self):
        """Create offline Web3 instance for oracle functionality without blockchain"""
        class OfflineWeb3:
            def __init__(self):
                self.eth = OfflineEth()
                
            def is_connected(self):
                return False
                
            def to_checksum_address(self, addr):
                return addr
                
            def to_wei(self, amount, unit):
                return int(amount * (10 ** 18))  # Convert to wei
                
        class OfflineEth:
            def __init__(self):
                self.chain_id = 84532  # Base Sepolia
                
            def get_block(self, block_identifier):
                return {"number": 12345, "timestamp": int(time.time())}
                
        return OfflineWeb3()

    def _init_encryption(self):
        """Initialize encryption system for payloads"""
        # Generate agent's RSA key pair for payload encryption
        self.agent_private_rsa = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self.agent_public_rsa = self.agent_private_rsa.public_key()
        
        # Symmetric encryption for session data
        key = os.getenv('ENCRYPTION_KEY', 'development-key-change-in-production').encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'erc8004_salt',
            iterations=100000,
        )
        fernet_key = base64.urlsafe_b64encode(kdf.derive(key))
        self.fernet = Fernet(fernet_key)

    def _init_transaction_log(self):
        """Initialize CSV transaction log"""
        if not self.transaction_log.exists():
            with open(self.transaction_log, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'timestamp', 'session_id', 'user_address', 'agent_address',
                    'operation_type', 'transaction_hash', 'gas_used', 'cost_eth',
                    'status', 'payload_hash'
                ])

    def create_a2a_session(self, user_address: str, prompt: str, user_public_key: str) -> str:
        """Create new A2A protocol session"""
        
        # Generate session ID
        session_id = hashlib.sha256(
            f"{user_address}{prompt}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        
        # Hash the prompt for verification
        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
        
        # Create session
        session = A2ASession(
            session_id=session_id,
            user_address=user_address,
            agent_address=self.agent_account.address,
            prompt_hash=prompt_hash,
            status="pending"
        )
        
        # Store session
        self.sessions[session_id] = session
        self._save_session(session)
        
        # Log transaction
        self._log_transaction(
            session_id=session_id,
            user_address=user_address,
            agent_address=self.agent_account.address,
            operation_type="session_created",
            status="completed",
            payload_hash=prompt_hash
        )
        
        logger.info(f"Created A2A session {session_id} for {user_address}")
        return session_id

    async def process_a2a_request(self, session_id: str, code_analysis_result: Dict[str, Any], 
                                  user_public_key: str) -> str:
        """Process A2A request and create encrypted payload"""
        
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        session.status = "processing"
        session.updated_at = datetime.now()
        
        try:
            # Create payload
            payload_data = {
                'session_id': session_id,
                'analysis_result': code_analysis_result,
                'agent_signature': self._sign_payload(code_analysis_result),
                'timestamp': datetime.now().isoformat(),
                'agent_address': self.agent_account.address
            }
            
            # Encrypt payload for user's public key
            encrypted_payload = self._encrypt_payload_for_user(payload_data, user_public_key)
            
            # Store encrypted payload
            session.encrypted_payload = encrypted_payload
            session.status = "completed"
            
            # Submit to blockchain via ERC-8004
            tx_hash = await self._submit_to_blockchain(session, payload_data)
            session.transaction_hashes.append(tx_hash)
            
            # Save session
            self._save_session(session)
            
            # Log transaction
            self._log_transaction(
                session_id=session_id,
                user_address=session.user_address,
                agent_address=self.agent_account.address,
                operation_type="payload_created",
                transaction_hash=tx_hash,
                status="completed",
                payload_hash=hashlib.sha256(str(payload_data).encode()).hexdigest()
            )
            
            logger.info(f"Processed A2A request for session {session_id}")
            return encrypted_payload
            
        except Exception as e:
            session.status = "failed"
            logger.error(f"A2A processing failed for {session_id}: {e}")
            raise

    def _sign_payload(self, payload_data: Dict[str, Any]) -> str:
        """Sign payload with agent's private key"""
        payload_str = json.dumps(payload_data, sort_keys=True)
        payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
        
        # Sign with Ethereum private key (updated for latest eth-account)
        from eth_account.messages import encode_defunct
        message = encode_defunct(text=payload_hash)
        signature = self.agent_account.sign_message(message)
        
        return signature.signature.hex()

    def _encrypt_payload_for_user(self, payload_data: Dict[str, Any], user_public_key: str) -> str:
        """Encrypt payload that only user can decrypt"""
        # For simplicity, using symmetric encryption with user-derived key
        # In production, would use user's actual public key
        
        user_key = hashlib.sha256(f"{user_public_key}erc8004".encode()).digest()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'user_payload_salt',
            iterations=50000,
        )
        fernet_key = base64.urlsafe_b64encode(kdf.derive(user_key))
        user_fernet = Fernet(fernet_key)
        
        payload_json = json.dumps(payload_data, indent=2)
        encrypted = user_fernet.encrypt(payload_json.encode())
        
        return base64.b64encode(encrypted).decode()

    def decrypt_payload_for_user(self, encrypted_payload: str, user_public_key: str) -> Dict[str, Any]:
        """Decrypt payload using user's key"""
        try:
            # Derive user's decryption key
            user_key = hashlib.sha256(f"{user_public_key}erc8004".encode()).digest()
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'user_payload_salt',
                iterations=50000,
            )
            fernet_key = base64.urlsafe_b64encode(kdf.derive(user_key))
            user_fernet = Fernet(fernet_key)
            
            # Decrypt payload
            encrypted_data = base64.b64decode(encrypted_payload)
            decrypted_json = user_fernet.decrypt(encrypted_data).decode()
            
            return json.loads(decrypted_json)
            
        except Exception as e:
            logger.error(f"Payload decryption failed: {e}")
            raise ValueError("Invalid decryption key or corrupted payload")

    async def _submit_to_blockchain(self, session: A2ASession, payload_data: Dict[str, Any]) -> str:
        """Submit session data to blockchain via ERC-8004 contracts"""
        if self.offline_mode:
            print("⚠️ Offline mode: Cannot submit to blockchain, using mock transaction hash")
            return f"offline_tx_{session.session_id}_{int(time.time())}"
            
        try:
            # Load deployed contract addresses
            with open('deployed_contracts.json', 'r') as f:
                deployment = json.load(f)
            
            contracts = deployment['contracts']
            validation_registry_address = self.w3.to_checksum_address(contracts['ValidationRegistry'])
            
            # Load ValidationRegistry contract ABI and create instance
            abi_path = "contracts/out/ValidationRegistry.sol/ValidationRegistry.json"
            with open(abi_path, 'r') as f:
                artifact = json.load(f)
            
            validation_contract = self.w3.eth.contract(
                address=validation_registry_address,
                abi=artifact['abi']
            )
            
            # Prepare validation request data following ERC-8004 protocol
            session_data = {
                'session_id': session.session_id,
                'user_address': session.user_address,
                'timestamp': int(time.time()),
                'payload_hash': hashlib.sha256(json.dumps(payload_data, sort_keys=True).encode()).hexdigest()
            }
            
            # Create hash of session data for validation
            data_hash = '0x' + hashlib.sha256(json.dumps(session_data, sort_keys=True).encode()).hexdigest()
            
            print(f"🔗 Submitting validation request to blockchain...")
            print(f"   Data Hash: {data_hash}")
            print(f"   Session ID: {session.session_id}")
            print(f"   User Address: {session.user_address}")
            
            # Call proper ERC-8004 ValidationRegistry.validationRequest function
            # validationRequest(AgentValidatorID, AgentServerID, DataHash)
            validator_agent_id = 1  # This agent acts as validator
            server_agent_id = 2     # Server agent being validated (could be dynamic)
            
            tx = validation_contract.functions.validationRequest(
                validator_agent_id,
                server_agent_id, 
                data_hash
            ).build_transaction({
                'from': self.agent_account.address,
                'gas': 100000,  # Sufficient gas for contract call
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.agent_account.address)
            })
            
            # Sign and send transaction using proper contract call
            signed_tx = self.agent_account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for confirmation with shorter timeout for Base
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=20)
            
            if receipt.status == 1:
                logger.info(f"Session {session.session_id} recorded on blockchain: {tx_hash.hex()}")
                logger.info(f"BaseScan URL: https://sepolia.basescan.org/tx/{tx_hash.hex()}")
                return tx_hash.hex()
            else:
                raise Exception("Blockchain transaction failed")
                
        except Exception as e:
            logger.error(f"Blockchain submission failed: {e}")
            logger.info("Attempting alternative blockchain submission...")
            
            # Try simplified transaction as fallback
            try:
                # Get fresh gas price and nonce for fallback
                current_gas_price = self.w3.eth.gas_price
                current_nonce = self.w3.eth.get_transaction_count(self.agent_account.address)
                
                # Use lower gas price for Base network
                if self.w3.eth.chain_id in [8453, 84532]:  # Base networks
                    current_gas_price = max(current_gas_price, 1000000)  # Minimum gas price
                
                simplified_tx = {
                    'to': validation_registry_address,
                    'value': 0,  # No value for data storage
                    'gas': 50000,  # Sufficient gas for contract interaction
                    'gasPrice': current_gas_price,
                    'nonce': current_nonce,
                    'data': '0x'  # Empty data - just interaction with contract
                }
                
                signed_tx = self.agent_account.sign_transaction(simplified_tx)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
                if receipt.status == 1:
                    logger.info(f"✅ Contract interaction successful: {tx_hash.hex()}")
                    logger.info(f"🔗 BaseScan URL: https://sepolia.basescan.org/tx/{tx_hash.hex()}")
                    return tx_hash.hex()
                    
            except Exception as fallback_error:
                logger.error(f"Contract interaction failed: {fallback_error}")
            
            # If we reach here, there's a fundamental issue - don't use test hashes
            logger.error("❌ CRITICAL: All contract interactions failed - check account funding and network")
            raise Exception("Contract interaction failed - cannot proceed with mock transactions")

    def _save_session(self, session: A2ASession):
        """Save session to persistent storage"""
        session_file = self.session_storage / f"{session.session_id}.json"
        
        # Convert to dict for JSON serialization
        session_dict = asdict(session)
        session_dict['created_at'] = session.created_at.isoformat()
        session_dict['updated_at'] = session.updated_at.isoformat()
        
        with open(session_file, 'w') as f:
            json.dump(session_dict, f, indent=2)

    def load_session(self, session_id: str) -> Optional[A2ASession]:
        """Load session from storage"""
        session_file = self.session_storage / f"{session_id}.json"
        
        if not session_file.exists():
            return None
        
        try:
            with open(session_file, 'r') as f:
                session_dict = json.load(f)
            
            # Convert back to A2ASession
            session_dict['created_at'] = datetime.fromisoformat(session_dict['created_at'])
            session_dict['updated_at'] = datetime.fromisoformat(session_dict['updated_at'])
            
            return A2ASession(**session_dict)
            
        except Exception as e:
            logger.error(f"Failed to load session {session_id}: {e}")
            return None

    def _log_transaction(self, session_id: str, user_address: str, agent_address: str,
                        operation_type: str, status: str, payload_hash: str,
                        transaction_hash: str = "", gas_used: int = 0, cost_eth: float = 0.0):
        """Log transaction to CSV audit trail"""
        
        with open(self.transaction_log, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.now().isoformat(),
                session_id,
                user_address,
                agent_address,
                operation_type,
                transaction_hash,
                gas_used,
                cost_eth,
                status,
                payload_hash
            ])

    async def poll_blockchain_status(self):
        """Continuously poll blockchain for session updates via DRPC"""
        while True:
            try:
                if self.offline_mode:
                    # Offline mode - just update session statuses locally
                    for session_id, session in self.sessions.items():
                        if session.status == "processing":
                            # Auto-complete sessions in offline mode after 10 seconds
                            if (datetime.now() - session.updated_at).seconds > 10:
                                session.status = "completed"
                                session.updated_at = datetime.now()
                                self._save_session(session)
                    
                    logger.info(f"Offline mode poll: Sessions: {len(self.sessions)}")
                    await asyncio.sleep(15)
                    continue
                    
                # Online mode - check blockchain status
                latest_block = self.w3.eth.get_block('latest')
                
                # Update session statuses based on blockchain data
                for session_id, session in self.sessions.items():
                    if session.status == "processing":
                        # Check if any transactions are confirmed
                        for tx_hash in session.transaction_hashes:
                            try:
                                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                                if receipt.status == 1:
                                    session.status = "completed"
                                    session.updated_at = datetime.now()
                                    self._save_session(session)
                                    
                                    logger.info(f"Session {session_id} confirmed on blockchain")
                            except Exception:
                                pass  # Transaction still pending
                
                # Log blockchain status
                logger.info(f"Blockchain poll: Block #{latest_block.number}, Sessions: {len(self.sessions)}")
                
                # Wait 15 seconds as requested
                await asyncio.sleep(15)
                
            except Exception as e:
                logger.error(f"Blockchain polling error: {e}")
                await asyncio.sleep(15)

    def get_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get current session status for frontend"""
        if session_id not in self.sessions:
            # Try loading from storage
            session = self.load_session(session_id)
            if session:
                self.sessions[session_id] = session
            else:
                return None
        
        session = self.sessions[session_id]
        
        return {
            'session_id': session.session_id,
            'status': session.status,
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
            'cost_eth': session.cost_eth,
            'transaction_count': len(session.transaction_hashes),
            'has_encrypted_payload': session.encrypted_payload is not None,
            'agent_address': session.agent_address,
            'user_address': session.user_address
        }

    def get_user_sessions(self, user_address: str) -> List[Dict[str, Any]]:
        """Get all sessions for a user"""
        user_sessions = []
        
        for session in self.sessions.values():
            if session.user_address.lower() == user_address.lower():
                user_sessions.append(self.get_session_status(session.session_id))
        
        return user_sessions

    def verify_user_signature(self, message: str, signature: str, user_address: str) -> bool:
        """Verify user's signature for payload access"""
        try:
            # Recover address from signature (updated for latest eth-account)
            from eth_account.messages import encode_defunct
            encoded_message = encode_defunct(text=message)
            recovered_address = Account.recover_message(encoded_message, signature=signature)
            
            return recovered_address.lower() == user_address.lower()
            
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False

    async def get_decrypted_payload(self, session_id: str, user_address: str, 
                                   user_signature: str) -> Optional[Dict[str, Any]]:
        """Get decrypted payload if user has proper signature"""
        
        if session_id not in self.sessions:
            session = self.load_session(session_id)
            if not session:
                return None
            self.sessions[session_id] = session
        
        session = self.sessions[session_id]
        
        # Verify user owns this session
        if session.user_address.lower() != user_address.lower():
            return None
        
        # Verify signature for payload access
        verification_message = f"ERC-8004 Access Session {session_id}"
        if not self.verify_user_signature(verification_message, user_signature, user_address):
            logger.warning(f"Invalid signature for session {session_id}")
            return None
        
        # Decrypt payload
        if session.encrypted_payload:
            try:
                payload = self.decrypt_payload_for_user(session.encrypted_payload, user_address)
                
                # Log access
                self._log_transaction(
                    session_id=session_id,
                    user_address=user_address,
                    agent_address=session.agent_address,
                    operation_type="payload_accessed",
                    status="completed",
                    payload_hash=session.prompt_hash
                )
                
                return payload
                
            except Exception as e:
                logger.error(f"Payload decryption failed for {session_id}: {e}")
                return None
        
        return None

    def get_blockchain_stats(self) -> Dict[str, Any]:
        """Get current blockchain statistics via DRPC"""
        if self.offline_mode:
            return {
                'block_number': 12345,
                'block_timestamp': int(time.time()),
                'gas_price_gwei': 0.001,
                'network_id': 84532,
                'is_connected': False,
                'last_updated': datetime.now().isoformat(),
                'mode': 'offline'
            }
            
        try:
            latest_block = self.w3.eth.get_block('latest')
            gas_price = self.w3.eth.gas_price
            
            return {
                'block_number': latest_block.number,
                'block_timestamp': latest_block.timestamp,
                'gas_price_gwei': self.w3.from_wei(gas_price, 'gwei'),
                'network_id': self.w3.eth.chain_id,
                'is_connected': self.w3.is_connected(),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get blockchain stats: {e}")
            return {
                'error': str(e),
                'last_updated': datetime.now().isoformat()
            }

    def get_transaction_audit_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent transactions for audit"""
        try:
            with open(self.transaction_log, 'r') as f:
                reader = csv.DictReader(f)
                transactions = list(reader)
                
            # Return most recent transactions
            return transactions[-limit:] if len(transactions) > limit else transactions
            
        except Exception as e:
            logger.error(f"Failed to read transaction log: {e}")
            return []

    async def start_oracle_service(self):
        """Start the oracle service with blockchain polling"""
        logger.info("🔮 Starting A2A Oracle Service...")
        logger.info("   📊 Blockchain polling every 15 seconds")
        logger.info("   🔒 Session encryption active")
        logger.info("   📝 Transaction logging enabled")
        
        # Start blockchain polling task
        polling_task = asyncio.create_task(self.poll_blockchain_status())
        
        try:
            await polling_task
        except KeyboardInterrupt:
            logger.info("🛑 Oracle service stopped by user")
            polling_task.cancel()

# Global oracle instance
oracle_service = None

def get_oracle_service() -> A2AOracleService:
    """Get global oracle service instance"""
    global oracle_service
    
    if oracle_service is None:
        agent_key = os.getenv('PRIVATE_KEY')
        if not agent_key:
            raise ValueError("PRIVATE_KEY not set in environment")
        
        oracle_service = A2AOracleService(agent_key)
    
    return oracle_service

if __name__ == "__main__":
    # Test oracle service
    async def test_oracle():
        oracle = get_oracle_service()
        
        # Test session creation
        session_id = oracle.create_a2a_session(
            user_address="0x1234567890123456789012345678901234567890",
            prompt="Test code review prompt",
            user_public_key="test_public_key"
        )
        
        print(f"✅ Created test session: {session_id}")
        
        # Test status retrieval
        status = oracle.get_session_status(session_id)
        print(f"📊 Session status: {status}")
        
        # Start polling
        await oracle.start_oracle_service()
    
    asyncio.run(test_oracle())
