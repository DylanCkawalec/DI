import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CheckBadgeIcon,
  LinkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface TEEStatus {
  tee_available: boolean;
  contracts_deployed: boolean;
  tee_verifier: string;
  identity_registry: string;
  chain_id: string;
  rpc_url: string;
}

interface AgentInfo {
  agentId: number;
  agentDomain: string;
  agentAddress: string;
  teeMeasurementHash: string;
  domainVerified: boolean;
  trustWeight: number;
}

export default function TEEProtocolDemo() {
  const [teeStatus, setTeeStatus] = useState<TEEStatus | null>(null);
  const [agentDomain, setAgentDomain] = useState('');
  const [registeredAgent, setRegisteredAgent] = useState<AgentInfo | null>(null);
  const [trustedMeasurements, setTrustedMeasurements] = useState<any[]>([]);
  const [status, setStatus] = useState('Initializing TEE Protocol...');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  useEffect(() => {
    checkTEEStatus();
    loadTrustedMeasurements();
  }, []);

  const checkTEEStatus = async () => {
    try {
      const response = await fetch('/api/tee/status');
      const data = await response.json();
      setTeeStatus(data);
      
      if (data.contracts_deployed) {
        setStatus('✅ TEE-Enhanced Protocol Ready');
      } else {
        setStatus('⚠️ Contracts not deployed');
      }
    } catch (error) {
      setStatus('❌ TEE Status Check Failed');
      console.error('TEE status check failed:', error);
    }
  };

  const loadTrustedMeasurements = async () => {
    try {
      const response = await fetch('/api/tee/measurements');
      const data = await response.json();
      if (data.success) {
        setTrustedMeasurements(data.measurements);
      }
    } catch (error) {
      console.error('Failed to load trusted measurements:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus('❌ MetaMask not detected');
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      setUserAddress(accounts[0]);
      setConnected(true);
      setStatus('✅ Wallet connected');
    } catch (error) {
      setStatus('❌ Wallet connection failed');
    }
  };

  const handleRegisterTEEAgent = async () => {
    if (!agentDomain.trim()) {
      setStatus('❌ Domain required');
      return;
    }

    if (!connected) {
      setStatus('❌ Connect wallet first');
      return;
    }

    setLoading(true);
    setStatus('🔐 Registering TEE Agent...');
    
    try {
      const response = await fetch('/api/tee/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: agentDomain })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ TEE Agent Registered! ID: ${data.agent_id}`);
        setRegisteredAgent({
          agentId: data.agent_id,
          agentDomain: data.domain,
          agentAddress: data.address,
          teeMeasurementHash: data.measurement_hash || '0x',
          domainVerified: false,
          trustWeight: data.trust_weight || 10
        });
      } else {
        setStatus(`❌ Registration Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setStatus(`❌ Registration Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              ERC-8004 TEE-Enhanced Protocol
            </h1>
            <span className="px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full">
              Cryptographically Secured
            </span>
            {connected && (
              <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full">
                Connected
              </span>
            )}
          </div>
          
          <div className={`p-4 rounded-lg border ${
            status.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' :
            status.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <p className="font-medium">{status}</p>
          </div>
        </div>
      </motion.div>

      {/* Connection Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GlobeAltIcon className="h-6 w-6 text-blue-600" />
              Blockchain Connection
            </h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Network:</span> Base Sepolia (84532)
              </div>
              <div>
                <span className="font-semibold">RPC:</span> DRPC Endpoint
              </div>
              <div>
                <span className="font-semibold">Status:</span>{' '}
                <span className={connected ? 'text-green-600' : 'text-red-600'}>
                  {connected ? '✅ Connected' : '❌ Disconnected'}
                </span>
              </div>
              {userAddress && (
                <div>
                  <span className="font-semibold">Address:</span>
                  <div className="font-mono text-xs mt-1 p-2 bg-gray-50 rounded">
                    {userAddress}
                  </div>
                </div>
              )}
            </div>
            
            {!connected && (
              <button
                onClick={connectWallet}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CpuChipIcon className="h-6 w-6 text-green-600" />
              TEE Status
            </h2>
            
            {teeStatus && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    teeStatus.tee_available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    TEE: {teeStatus.tee_available ? 'Available' : 'Unavailable'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    teeStatus.contracts_deployed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Contracts: {teeStatus.contracts_deployed ? 'Deployed' : 'Missing'}
                  </span>
                </div>
                
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-semibold">TEE Verifier:</span>
                    <div className="font-mono text-xs mt-1 p-2 bg-gray-50 rounded">
                      {teeStatus.tee_verifier}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Identity Registry:</span>
                    <div className="font-mono text-xs mt-1 p-2 bg-gray-50 rounded">
                      {teeStatus.identity_registry}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Agent Registration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckBadgeIcon className="h-6 w-6 text-purple-600" />
            TEE Agent Registration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent Domain
              </label>
              <input
                type="text"
                placeholder="agent.example.com"
                value={agentDomain}
                onChange={(e) => setAgentDomain(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRegisterTEEAgent}
                disabled={loading || !connected}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              
              <button
                onClick={loadTrustedMeasurements}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChartBarIcon className="h-4 w-4" />
                Refresh Measurements
              </button>
            </div>

            {registeredAgent && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckBadgeIcon className="h-5 w-5" />
                  Registered Agent
                </h3>
                <div className="text-sm space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><span className="font-medium">ID:</span> {registeredAgent.agentId}</div>
                    <div><span className="font-medium">Domain:</span> {registeredAgent.agentDomain}</div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Address:</span>
                      <div className="font-mono text-xs mt-1">{registeredAgent.agentAddress}</div>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">TEE Measurement:</span>
                      <div className="font-mono text-xs mt-1">{registeredAgent.teeMeasurementHash}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      registeredAgent.domainVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      Domain: {registeredAgent.domainVerified ? 'Verified' : 'Unverified'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      registeredAgent.trustWeight >= 80 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Trust: {registeredAgent.trustWeight}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Trusted Measurements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            Trusted TEE Measurements
          </h2>
          
          {trustedMeasurements.length > 0 ? (
            <div className="space-y-3">
              {trustedMeasurements.map((measurement, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      measurement.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {measurement.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="font-semibold text-gray-900">{measurement.description}</span>
                  </div>
                  <div className="font-mono text-xs text-gray-600 p-2 bg-gray-100 rounded">
                    {measurement.measurementHash}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CpuChipIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Loading trusted measurements...</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Protocol Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            Protocol Capabilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <CpuChipIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">TEE Attestation</h3>
              <p className="text-sm text-blue-700">
                Intel TDX/AMD SEV cryptographic verification
              </p>
            </div>
            
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
              <GlobeAltIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">RA-TLS Certificates</h3>
              <p className="text-sm text-green-700">
                Domain verification via trusted certificates
              </p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 border border-purple-200 rounded-lg">
              <ChartBarIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">Progressive Trust</h3>
              <p className="text-sm text-purple-700">
                10% → 100% weight based on verification
              </p>
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