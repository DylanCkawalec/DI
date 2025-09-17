import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractStatusMonitor from './ContractStatusMonitor';
import AgentRegistration from './AgentRegistration';
import A2AProtocolDemo from './A2AProtocolDemo';
import WalletConnectionGuide from './WalletConnectionGuide';
import { motion, AnimatePresence } from 'framer-motion';

interface TrustlessAgentInterfaceProps {
  web3Provider?: any;
  isWalletConnected: boolean;
  walletAddress: string;
  onConnect: () => void;
}

interface UserAgent {
  id: number;
  domain: string;
  address: string;
  hasTEE: boolean;
  registeredAt: Date;
}

const TrustlessAgentInterface: React.FC<TrustlessAgentInterfaceProps> = ({
  web3Provider,
  isWalletConnected,
  walletAddress,
  onConnect
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'protocol' | 'agents'>('overview');
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<UserAgent | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Contract addresses
  const IDENTITY_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || '0x4bE957cceC6aEc4258F2419BcAF5B5341B14052f';
  const IDENTITY_REGISTRY_ABI = [
    'function getAgent(uint256 agentId) external view returns (tuple(uint256 agentId, string agentDomain, address agentAddress, uint256 timestamp))',
    'function resolveByAddress(address agentAddress) external view returns (tuple(uint256 agentId, string agentDomain, address agentAddress, uint256 timestamp))',
    'function getAgentCount() external view returns (uint256)',
    'function hasTEEAttestation(uint256 agentId) external view returns (bool)'
  ];

  // Load user's registered agents
  useEffect(() => {
    const loadUserAgents = async () => {
      if (!isWalletConnected || !web3Provider || !walletAddress) {
        return;
      }

      setIsLoadingAgents(true);
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI, provider);

        try {
          // Try to resolve agent by user's address
          const agentInfo = await contract.resolveByAddress(walletAddress);
          
          if (agentInfo.agentId && Number(agentInfo.agentId) > 0) {
            const hasTEE = await contract.hasTEEAttestation(agentInfo.agentId);
            
            const userAgent: UserAgent = {
              id: Number(agentInfo.agentId),
              domain: agentInfo.agentDomain,
              address: agentInfo.agentAddress,
              hasTEE: hasTEE,
              registeredAt: new Date(Number(agentInfo.timestamp) * 1000)
            };
            
            setUserAgents([userAgent]);
            setSelectedAgent(userAgent);
          }
        } catch (e) {
          // No agent found for this address - this is fine
          setUserAgents([]);
        }

        setNetworkStatus('connected');
      } catch (error) {
        console.error('Failed to load user agents:', error);
        setNetworkStatus('disconnected');
      } finally {
        setIsLoadingAgents(false);
      }
    };

    loadUserAgents();
  }, [isWalletConnected, web3Provider, walletAddress]);

  const handleAgentRegistered = (agentId: number) => {
    // Refresh user agents after registration
    setTimeout(() => {
      window.location.reload(); // Simple refresh for now
    }, 2000);
  };

  const tabs = [
    { key: 'overview', label: 'System Overview', icon: '📊', description: 'Monitor contract status and system health' },
    { key: 'register', label: 'Register Agent', icon: '🤖', description: 'Register your trustless AI agent on-chain' },
    { key: 'protocol', label: 'A2A Protocol', icon: '🔗', description: 'Interact with trustless agents' },
    { key: 'agents', label: 'My Agents', icon: '👤', description: 'Manage your registered agents', badge: userAgents.length || undefined }
  ];

  // Show wallet connection guide if not connected
  if (!isWalletConnected) {
    return <WalletConnectionGuide onConnectWallet={onConnect} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ERC-8004 Trustless AI Agents
              </h1>
              <p className="text-gray-600 mt-1">
                Agent-to-Agent protocol with cryptographic security and blockchain validation
              </p>
            </div>
            
            {/* Wallet Status */}
            <div className="flex items-center gap-4">
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                networkStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className="mr-2">{networkStatus === 'connected' ? '🟢' : '🔴'}</span>
                Base Sepolia {networkStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
              
              <button
                onClick={onConnect}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isWalletConnected
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isWalletConnected 
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
                  : 'Connect Wallet'
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 absolute left-0 top-full whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {tab.description}
                </p>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <ContractStatusMonitor />
              
              {/* User Agent Summary */}
              {isWalletConnected && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Agent Status</h3>
                  {isLoadingAgents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading your agents...</span>
                    </div>
                  ) : userAgents.length > 0 ? (
                    <div className="space-y-3">
                      {userAgents.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <div className="font-medium text-green-800">Agent #{agent.id}</div>
                            <div className="text-sm text-green-600">{agent.domain}</div>
                            <div className="text-xs text-gray-500">
                              Registered: {agent.registeredAt.toLocaleDateString()}
                              {agent.hasTEE && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">TEE Verified</span>}
                            </div>
                          </div>
                          <div className="text-green-600">
                            <span className="text-2xl">✅</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="text-4xl mb-4">🤖</div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No Agents Registered</h4>
                      <p className="text-gray-600 mb-4">Register your first trustless AI agent to get started</p>
                      <button
                        onClick={() => setActiveTab('register')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Register Agent
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <AgentRegistration 
                web3Provider={web3Provider}
                isWalletConnected={isWalletConnected}
                onRegistrationSuccess={handleAgentRegistered}
              />
            </motion.div>
          )}

          {activeTab === 'protocol' && (
            <motion.div
              key="protocol"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <A2AProtocolDemo 
                web3Provider={web3Provider}
                isWalletConnected={isWalletConnected}
              />
            </motion.div>
          )}

          {activeTab === 'agents' && (
            <motion.div
              key="agents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">My Registered Agents</h3>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Register New Agent
                  </button>
                </div>

                {isLoadingAgents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading your agents...</span>
                  </div>
                ) : userAgents.length > 0 ? (
                  <div className="space-y-4">
                    {userAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-800">Agent #{agent.id}</h4>
                              {agent.hasTEE && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                  🔐 TEE Verified
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div><strong>Domain:</strong> {agent.domain}</div>
                              <div><strong>Address:</strong> <span className="font-mono">{agent.address}</span></div>
                              <div><strong>Registered:</strong> {agent.registeredAt.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-green-600 text-2xl">✅</div>
                            <button
                              onClick={() => setSelectedAgent(agent)}
                              className="text-blue-600 hover:text-blue-700 text-sm underline"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                        
                        {selectedAgent?.id === agent.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="bg-gray-50 rounded p-3">
                              <h5 className="font-medium text-gray-800 mb-2">Agent Capabilities</h5>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>• Code review and security analysis</div>
                                <div>• Cryptographic verification via blockchain</div>
                                <div>• Agent-to-agent communication protocol</div>
                                {agent.hasTEE && <div>• Hardware-secured execution environment</div>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤖</div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">No Agents Found</h4>
                    <p className="text-gray-600 mb-6">
                      You haven't registered any agents yet. Get started by registering your first trustless AI agent.
                    </p>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Register Your First Agent
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              ERC-8004 Trustless AI Agents • Base Sepolia Network
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <a href="https://sepolia.basescan.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                BaseScan Explorer
              </a>
              <span>•</span>
              <a href="https://docs.base.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                Base Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TrustlessAgentInterface;
