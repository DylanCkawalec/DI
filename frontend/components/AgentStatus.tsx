import React from 'react';
import { motion } from 'framer-motion';
import {
  CpuChipIcon,
  ShieldCheckIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface Agent {
  id: number | null;
  status: 'online' | 'offline' | 'busy';
  domain: string;
}

interface AgentStatusProps {
  agents: {
    server: Agent;
    validator: Agent;
    client: Agent;
  };
}

export default function AgentStatus({ agents }: AgentStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'offline': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircleIcon;
      case 'busy': return ClockIcon;
      case 'offline': return XCircleIcon;
      default: return XCircleIcon;
    }
  };

  const agentConfigs = [
    {
      key: 'server',
      name: 'Alice (Server)',
      role: 'Code Review AI',
      icon: CpuChipIcon,
      description: 'Provides AI-powered code analysis and review services',
      capabilities: ['Security Analysis', 'Performance Review', 'Style Checking', 'Best Practices']
    },
    {
      key: 'validator',
      name: 'Bob (Validator)',
      role: 'Review Validator',
      icon: ShieldCheckIcon,
      description: 'Validates and verifies the quality of code reviews',
      capabilities: ['Quality Assurance', 'Methodology Validation', 'Accuracy Checking', 'Completeness Review']
    },
    {
      key: 'client',
      name: 'Charlie (Client)',
      role: 'Feedback Provider',
      icon: UserIcon,
      description: 'Manages feedback and reputation for trustless interactions',
      capabilities: ['Feedback Management', 'Reputation Tracking', 'Trust Scoring', 'Review Rating']
    }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SignalIcon className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">ERC-8004 Agents</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">Network Active</span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agentConfigs.map((config, index) => {
          const agent = agents[config.key as keyof typeof agents];
          const StatusIcon = getStatusIcon(agent.status);
          
          return (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-600 rounded-lg">
                    <config.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{config.name}</h4>
                    <p className="text-gray-400 text-sm">{config.role}</p>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${getStatusColor(agent.status)}`}>
                  <StatusIcon className="h-3 w-3" />
                  <span className="text-xs font-medium capitalize">{agent.status}</span>
                </div>
              </div>

              {/* Agent Details */}
              <div className="space-y-3">
                <p className="text-gray-300 text-sm">{config.description}</p>
                
                {/* Agent ID */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-xs">Agent ID:</span>
                  <span className="text-blue-400 text-xs font-mono">
                    {agent.id ? `#${agent.id}` : 'Pending...'}
                  </span>
                </div>

                {/* Domain */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-xs">Domain:</span>
                  <span className="text-gray-300 text-xs font-mono break-all">
                    {agent.domain}
                  </span>
                </div>

                {/* Capabilities */}
                <div>
                  <span className="text-gray-400 text-xs mb-2 block">Capabilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {config.capabilities.map((capability, capIndex) => (
                      <span
                        key={capIndex}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Connection Status Details */}
                {agent.status === 'online' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-2 border-t border-gray-600"
                  >
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Connected</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <SignalIcon className="h-3 w-3" />
                        <span>Ready</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {agent.status === 'offline' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-2 border-t border-gray-600"
                  >
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Initializing...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Network Summary */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-blue-400 font-medium mb-1">Trustless Agent Network</h4>
            <p className="text-blue-100 text-sm">
              Powered by ERC-8004 standard on Base Sepolia testnet
            </p>
          </div>
          <div className="text-right">
            <div className="text-blue-400 font-bold text-lg">
              {Object.values(agents).filter(a => a.status === 'online').length}/3
            </div>
            <div className="text-blue-300 text-xs">Agents Online</div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center space-x-4 text-xs text-blue-200">
          <div className="flex items-center space-x-1">
            <CheckCircleIcon className="h-3 w-3" />
            <span>Decentralized</span>
          </div>
          <div className="flex items-center space-x-1">
            <ShieldCheckIcon className="h-3 w-3" />
            <span>Trustless</span>
          </div>
          <div className="flex items-center space-x-1">
            <CpuChipIcon className="h-3 w-3" />
            <span>AI-Powered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
