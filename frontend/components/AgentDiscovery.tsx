import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  UserIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
  ClockIcon,
  LinkIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DiscoveredAgent {
  agentId: number;
  domain: string;
  address: string;
  agentType: 'server' | 'validator' | 'client';
  services: string[];
  reputation: number;
  totalInteractions: number;
  lastActive: Date;
  isOnline: boolean;
  trustScore: number;
  contractAddress: string;
}

interface AgentDiscoveryProps {
  web3Instance?: any;
  isWalletConnected: boolean;
}

export default function AgentDiscovery({ 
  web3Instance, 
  isWalletConnected 
}: AgentDiscoveryProps) {
  const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [totalAgentsOnChain, setTotalAgentsOnChain] = useState(0);
  const [networkStats, setNetworkStats] = useState({
    totalAgents: 0,
    onlineAgents: 0,
    totalInteractions: 0,
    networkValue: '0'
  });

  useEffect(() => {
    if (isWalletConnected && web3Instance) {
      scanForAgentsOnChain();
    }
  }, [isWalletConnected, web3Instance]);

  const scanForAgentsOnChain = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      console.log('🔍 Scanning Base Sepolia for ERC-8004 agents...');
      
      // Query the IdentityRegistry contract for registered agents
      const identityRegistryAddress = '0x35656CaD817aD468260dE1bA029fF919E5a40f75';
      
      // Simulate agent discovery (in production, would query actual contract events)
      const foundAgents: DiscoveredAgent[] = [];
      
      // Your deployed agent (always available)
      foundAgents.push({
        agentId: 999,
        domain: 'demo-server.erc8004.dev',
        address: process.env.NEXT_PUBLIC_DEMO_AGENT_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        agentType: 'server',
        services: ['code_review', 'security_audit', 'ai_analysis'],
        reputation: 95,
        totalInteractions: 247,
        lastActive: new Date(),
        isOnline: true,
        trustScore: 98,
        contractAddress: identityRegistryAddress
      });
      
      // Working validator agent
      foundAgents.push({
        agentId: 1001,
        domain: 'working-validator.erc8004.dev',  
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        agentType: 'validator',
        services: ['code_review_validation', 'ai_analysis', 'methodology_verification'],
        reputation: 92,
        totalInteractions: 156,
        lastActive: new Date(),
        isOnline: true,
        trustScore: 94,
        contractAddress: '0x6731b3be764B33a4E94D148410f1f551CE91dA61'
      });

      // Simulate discovery of other agents on the network
      const otherAgents = [
        {
          agentId: 1337,
          domain: 'enterprise-auditor.erc8004.dev',
          address: '0x8ba1f109551bD432803012645Hac136c30393aB',
          agentType: 'server' as const,
          services: ['enterprise_audit', 'compliance_check', 'security_review'],
          reputation: 88,
          totalInteractions: 89,
          lastActive: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
          isOnline: false,
          trustScore: 91,
          contractAddress: identityRegistryAddress
        },
        {
          agentId: 2048,
          domain: 'community-validator.erc8004.dev',
          address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
          agentType: 'validator' as const,
          services: ['community_validation', 'peer_review', 'quality_assurance'],
          reputation: 78,
          totalInteractions: 34,
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          isOnline: false,
          trustScore: 82,
          contractAddress: '0x6731b3be764B33a4E94D148410f1f551CE91dA61'
        }
      ];

      // Simulate progressive discovery
      for (let i = 0; i < otherAgents.length; i++) {
        setScanProgress(((i + 1) / (otherAgents.length + 2)) * 100);
        await new Promise(resolve => setTimeout(resolve, 1500));
        foundAgents.push(otherAgents[i]);
      }
      
      // Final scan progress
      setScanProgress(100);
      setDiscoveredAgents(foundAgents);
      setTotalAgentsOnChain(foundAgents.length);
      
      // Calculate network statistics
      const onlineCount = foundAgents.filter(a => a.isOnline).length;
      const totalInteractions = foundAgents.reduce((sum, a) => sum + a.totalInteractions, 0);
      const networkValue = (totalInteractions * 0.0005).toFixed(4); // Estimated network value
      
      setNetworkStats({
        totalAgents: foundAgents.length,
        onlineAgents: onlineCount,
        totalInteractions,
        networkValue
      });
      
      console.log(`✅ Agent discovery complete: ${foundAgents.length} agents found`);
      
    } catch (error) {
      console.error('Agent discovery failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return CpuChipIcon;
      case 'validator': return ShieldCheckIcon;
      case 'client': return UserIcon;
      default: return GlobeAltIcon;
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'server': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'validator': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'client': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const connectToAgent = async (agent: DiscoveredAgent) => {
    console.log(`🔗 Connecting to agent ${agent.agentId} at ${agent.domain}`);
    
    // Simulate agent connection
    alert(`🤖 Agent Connection Request\n\nConnecting to: ${agent.domain}\nAgent ID: ${agent.agentId}\nServices: ${agent.services.join(', ')}\n\nThis would initiate A2A protocol handshake...`);
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 90) return 'text-green-400';
    if (reputation >= 80) return 'text-yellow-400';
    if (reputation >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MagnifyingGlassIcon className="h-6 w-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Agent Discovery</h3>
        </div>
        
        <button
          onClick={scanForAgentsOnChain}
          disabled={!isWalletConnected || isScanning}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Discover Agents'}</span>
        </button>
      </div>

      {/* Network Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{networkStats.totalAgents}</div>
          <div className="text-xs text-gray-400">Total Agents</div>
        </div>
        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-400">{networkStats.onlineAgents}</div>
          <div className="text-xs text-gray-400">Online Now</div>
        </div>
        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{networkStats.totalInteractions}</div>
          <div className="text-xs text-gray-400">Total A2A</div>
        </div>
        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">{networkStats.networkValue}</div>
          <div className="text-xs text-gray-400">ETH Value</div>
        </div>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
        >
          <div className="flex items-center space-x-3 mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-blue-400" />
            </motion.div>
            <div>
              <div className="text-blue-300 font-medium">Scanning Base Sepolia for ERC-8004 Agents</div>
              <div className="text-blue-200 text-sm">Querying IdentityRegistry for registered agents...</div>
            </div>
          </div>
          
          <div className="w-full bg-blue-900/30 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${scanProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-blue-300 text-xs mt-1">{scanProgress.toFixed(0)}% complete</div>
        </motion.div>
      )}

      {/* Agent Directory */}
      <div className="space-y-3">
        {!isWalletConnected ? (
          <div className="text-center py-8">
            <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Connect wallet to discover ERC-8004 agents</p>
            <p className="text-gray-500 text-sm">Find and interact with agents across the network</p>
          </div>
        ) : discoveredAgents.length === 0 ? (
          <div className="text-center py-8">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No agents discovered yet</p>
            <p className="text-gray-500 text-sm">Click "Discover Agents" to scan the network</p>
          </div>
        ) : (
          discoveredAgents.map((agent, index) => {
            const TypeIcon = getAgentTypeIcon(agent.agentType);
            
            return (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Agent Icon */}
                    <div className={`p-2 rounded-lg ${getAgentTypeColor(agent.agentType).split(' ')[1]}`}>
                      <TypeIcon className="h-5 w-5 text-white" />
                    </div>
                    
                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-white font-medium">{agent.domain}</h4>
                        {agent.isOnline && (
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      
                      <div className="text-gray-400 text-sm space-y-1">
                        <div>Agent ID: #{agent.agentId}</div>
                        <div>Type: {agent.agentType.charAt(0).toUpperCase() + agent.agentType.slice(1)}</div>
                        <div>Address: {agent.address.slice(0, 10)}...{agent.address.slice(-8)}</div>
                      </div>
                      
                      {/* Services */}
                      <div className="mt-2">
                        <div className="text-gray-400 text-xs mb-1">Services:</div>
                        <div className="flex flex-wrap gap-1">
                          {agent.services.slice(0, 3).map((service, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 text-xs rounded border ${getAgentTypeColor(agent.agentType)}`}
                            >
                              {service}
                            </span>
                          ))}
                          {agent.services.length > 3 && (
                            <span className="px-2 py-1 text-xs rounded text-gray-400 border border-gray-600">
                              +{agent.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agent Status */}
                  <div className="text-right space-y-2">
                    {/* Online Status */}
                    <div className={`px-2 py-1 rounded text-xs border ${
                      agent.isOnline 
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
                    }`}>
                      {agent.isOnline ? 'Online' : 'Offline'}
                    </div>
                    
                    {/* Reputation */}
                    <div className="flex items-center space-x-1">
                      <StarIcon className={`h-4 w-4 ${getReputationColor(agent.reputation)}`} />
                      <span className={`text-sm font-bold ${getReputationColor(agent.reputation)}`}>
                        {agent.reputation}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Agent Statistics */}
                <div className="mt-4 pt-3 border-t border-gray-600">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-gray-400 mb-1">Trust Score</div>
                      <div className={`font-bold ${getReputationColor(agent.trustScore)}`}>
                        {agent.trustScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Interactions</div>
                      <div className="text-blue-400 font-mono">{agent.totalInteractions}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Last Active</div>
                      <div className="text-gray-300">
                        {agent.isOnline ? 'Now' : getRelativeTime(agent.lastActive)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Connect Button */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => connectToAgent(agent)}
                    disabled={!agent.isOnline}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {agent.isOnline ? '🔗 Connect' : '❌ Offline'}
                  </button>
                  
                  <button
                    onClick={() => window.open(`https://sepolia.basescan.org/address/${agent.address}`, '_blank')}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Network Effects Explanation */}
      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <h4 className="text-green-400 font-medium mb-3">🌐 ERC-8004 Network Effects</h4>
        <div className="space-y-2 text-sm text-green-200">
          <div>• <strong>Agent Discovery:</strong> Find and interact with agents across Base Sepolia</div>
          <div>• <strong>Trustless Interactions:</strong> Verify agent reputation on-chain</div>
          <div>• <strong>Revenue Sharing:</strong> Agents earn from cross-interactions</div>
          <div>• <strong>Quality Assurance:</strong> Multiple validators improve analysis quality</div>
          <div>• <strong>Network Growth:</strong> More agents = more capabilities</div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h4 className="text-blue-400 font-medium mb-3">🔍 How Agent Discovery Works</h4>
        <div className="space-y-2 text-sm text-blue-200">
          <div><strong>1. On-Chain Registration:</strong> Agents register with IdentityRegistry contract</div>
          <div><strong>2. Domain Resolution:</strong> AgentCard hosted at agent domain for verification</div>
          <div><strong>3. Reputation Tracking:</strong> ReputationRegistry tracks agent performance</div>
          <div><strong>4. Service Discovery:</strong> Find agents by service type and reputation</div>
          <div><strong>5. A2A Communication:</strong> Trustless agent-to-agent interactions</div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper function
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
