import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ethers } from 'ethers';

// TEE-Enhanced Contract ABIs (Simplified)
const IDENTITY_REGISTRY_ABI = [
  'function newAgent(string domain, address agentAddress) external payable returns (uint256)',
  'function newAgentWithTEE(string domain, address agentAddress, bytes32 measurementHash, bytes attestationProof) external payable returns (uint256)',
  'function verifyDomain(uint256 agentId, bytes32 rootPubKeyHash, bytes certificateProof) external returns (bool)',
  'function getAgent(uint256 agentId) external view returns (tuple(uint256 agentId, string agentDomain, address agentAddress, bytes32 teeMeasurementHash, bool domainVerified, bytes32 rootPubKeyHash))',
  'function hasTEEAttestation(uint256 agentId) external view returns (bool)',
  'function isDomainVerified(uint256 agentId) external view returns (bool)',
  'function getAgentsByMeasurement(bytes32 measurementHash) external view returns (uint256[])',
  'function REGISTRATION_FEE() external view returns (uint256)'
];

interface AgentInfo {
  agentId: number;
  agentDomain: string;
  agentAddress: string;
  teeMeasurementHash: string;
  domainVerified: boolean;
  rootPubKeyHash: string;
}

export default function TEEAgentPanel() {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contracts, setContracts] = useState<any>({});
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready to connect');
  const [agentDomain, setAgentDomain] = useState('');
  const [teeStatus, setTeeStatus] = useState<{hasTEE: boolean, domainVerified: boolean, trustWeight: number}>({
    hasTEE: false,
    domainVerified: false,
    trustWeight: 0
  });

  // Contract addresses from environment
  const TEE_VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_TEE_VERIFIER;
  const IDENTITY_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY;
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

  useEffect(() => {
    initializeContracts();
  }, []);

  const initializeContracts = async () => {
    try {
      if (!RPC_URL || !IDENTITY_REGISTRY_ADDRESS) {
        setStatus('❌ Contract addresses not configured');
        return;
      }

      const rpcProvider = new ethers.JsonRpcProvider(RPC_URL);
      setProvider(rpcProvider);

      // Initialize contracts
      const identityContract = new ethers.Contract(IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI, rpcProvider);
      
      setContracts({
        identity: identityContract
      });

      setStatus('✅ Connected to Base Sepolia via DRPC');
    } catch (error) {
      console.error('Contract initialization failed:', error);
      setStatus('❌ Contract initialization failed');
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus('❌ MetaMask not detected');
        return;
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const walletSigner = await provider.getSigner();
      
      setSigner(walletSigner);
      setStatus('✅ Wallet connected');

      // Update contracts with signer
      if (contracts.identity) {
        setContracts((prev: any) => ({
          ...prev,
          identity: prev.identity.connect(walletSigner)
        }));
      }
    } catch (error) {
      setStatus('❌ Wallet connection failed');
    }
  };

  const registerTEEAgent = async () => {
    if (!signer || !contracts.identity) {
      setStatus('❌ Connect wallet first');
      return;
    }

    if (!agentDomain.trim()) {
      setStatus('❌ Enter agent domain');
      return;
    }

    setLoading(true);
    try {
      // Get registration fee
      const fee = await contracts.identity.REGISTRATION_FEE();
      
      // Generate mock TEE attestation for demo
      const agentAddress = await signer.getAddress();
      const measurementHash = ethers.keccak256(ethers.toUtf8Bytes('demo-tee-measurement-v1.0.0'));
      const attestationProof = ethers.hexlify(ethers.randomBytes(256)); // Mock proof

      setStatus('🔐 Registering TEE-secured agent...');
      const tx = await contracts.identity.newAgentWithTEE(
        agentDomain,
        agentAddress,
        measurementHash,
        attestationProof,
        { value: fee }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === 'AgentRegistered');
      
      if (event) {
        const agentId = event.args.agentId.toNumber();
        setStatus(`✅ TEE Agent registered! ID: ${agentId}`);
        await loadAgentInfo(agentId);
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      setStatus(`❌ Registration failed: ${error.message?.slice(0, 100)}...`);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentInfo = async (agentId: number) => {
    if (!contracts.identity) return;

    try {
      const info = await contracts.identity.getAgent(agentId);
      const hasTEE = await contracts.identity.hasTEEAttestation(agentId);
      const domainVerified = await contracts.identity.isDomainVerified(agentId);
      
      setAgentInfo({
        agentId: info.agentId.toNumber(),
        agentDomain: info.agentDomain,
        agentAddress: info.agentAddress,
        teeMeasurementHash: info.teeMeasurementHash,
        domainVerified: info.domainVerified,
        rootPubKeyHash: info.rootPubKeyHash
      });

      // Calculate trust weight
      let trustWeight = 10; // Base
      if (hasTEE) trustWeight += 40; // TEE attestation
      if (domainVerified) trustWeight += 30; // Domain verification
      if (hasTEE && domainVerified) trustWeight += 20; // Full verification bonus

      setTeeStatus({
        hasTEE,
        domainVerified,
        trustWeight: Math.min(trustWeight, 100)
      });

    } catch (error) {
      console.error('Failed to load agent info:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              TEE-Enhanced ERC-8004 Protocol
            </h2>
            <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
              Cryptographically Secured
            </span>
          </div>
          
          {/* Status */}
          <div className={`p-4 rounded-lg border mb-6 ${
            status.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' :
            status.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <p className="text-sm font-medium">{status}</p>
          </div>

          {/* Contract Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-700">TEE Verifier</div>
              <div className="font-mono text-xs text-gray-600 mt-1">
                {TEE_VERIFIER_ADDRESS}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-700">Identity Registry</div>
              <div className="font-mono text-xs text-gray-600 mt-1">
                {IDENTITY_REGISTRY_ADDRESS}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {!signer && (
              <button
                onClick={connectWallet}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            )}
            
            {signer && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Domain
                  </label>
                  <input
                    type="text"
                    value={agentDomain}
                    onChange={(e) => setAgentDomain(e.target.value)}
                    placeholder="agent.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  onClick={registerTEEAgent}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CpuChipIcon className="h-4 w-4" />
                      Register TEE Agent
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Agent Information */}
          {agentInfo && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckBadgeIcon className="h-5 w-5" />
                Registered Agent
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Agent ID:</span> {agentInfo.agentId}
                  </div>
                  <div>
                    <span className="font-medium">Domain:</span> {agentInfo.agentDomain}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Address:</span>
                    <div className="font-mono text-xs mt-1">{agentInfo.agentAddress}</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">TEE Measurement:</span>
                    <div className="font-mono text-xs mt-1">{agentInfo.teeMeasurementHash}</div>
                  </div>
                </div>

                {/* TEE Status Badges */}
                <div className="flex gap-2 mt-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    teeStatus.hasTEE 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {teeStatus.hasTEE ? '✅ TEE Verified' : '❌ No TEE'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    teeStatus.domainVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {teeStatus.domainVerified ? '✅ Domain Verified' : '❌ No Domain'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    teeStatus.trustWeight >= 80 
                      ? 'bg-blue-100 text-blue-800' 
                      : teeStatus.trustWeight >= 50 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    Trust: {teeStatus.trustWeight}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Protocol Information */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Protocol Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <CpuChipIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-blue-900">TEE Attestation</div>
                <div className="text-xs text-blue-700 mt-1">
                  Intel TDX/AMD SEV cryptographic verification
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <GlobeAltIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-900">RA-TLS Certs</div>
                <div className="text-xs text-green-700 mt-1">
                  Domain verification via trusted certificates
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <CheckBadgeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-purple-900">Trust Weights</div>
                <div className="text-xs text-purple-700 mt-1">
                  Progressive trust: 10% → 100% based on verification
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}