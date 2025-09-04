import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CubeIcon,
  BanknotesIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface BlockchainStatusProps {
  compact?: boolean;
}

export default function BlockchainStatus({ compact = true }: BlockchainStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [blockNumber, setBlockNumber] = useState(0);
  const [gasPrice, setGasPrice] = useState('0');
  const [networkName, setNetworkName] = useState('Base Sepolia');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate blockchain connection check
    const checkConnection = async () => {
      setIsLoading(true);
      
      // Simulate network check delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setBlockNumber(Math.floor(Math.random() * 1000000) + 5000000);
      setGasPrice((Math.random() * 0.01 + 0.001).toFixed(6));
      setIsLoading(false);
    };

    checkConnection();

    // Simulate block updates
    const interval = setInterval(() => {
      setBlockNumber(prev => prev + 1);
      setGasPrice((Math.random() * 0.01 + 0.001).toFixed(6));
    }, 12000); // Base has ~2s block times, updating every 12s for demo

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center space-x-2"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700 rounded-full">
            <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-blue-400 rounded-full"></div>
            <span className="text-gray-400 text-sm">Connecting...</span>
          </div>
        ) : (
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
            isConnected 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            {isConnected ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <XCircleIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? networkName : 'Disconnected'}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CubeIcon className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Blockchain Status</h3>
        </div>
        
        {/* Connection Status */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
          isConnected 
            ? 'bg-green-500/20 border-green-500/30 text-green-400' 
            : 'bg-red-500/20 border-red-500/30 text-red-400'
        }`}>
          {isLoading ? (
            <>
              <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
              <span className="text-xs">Connecting</span>
            </>
          ) : isConnected ? (
            <>
              <CheckCircleIcon className="h-3 w-3" />
              <span className="text-xs">Connected</span>
            </>
          ) : (
            <>
              <XCircleIcon className="h-3 w-3" />
              <span className="text-xs">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Network Info */}
      <div className="space-y-4">
        {/* Network Name */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <LinkIcon className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">Network</span>
          </div>
          <span className="text-blue-400 font-mono">{networkName}</span>
        </div>

        {/* Block Number */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <CubeIcon className="h-5 w-5 text-purple-400" />
            <span className="text-white font-medium">Latest Block</span>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
            ) : (
              <motion.span
                key={blockNumber}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-purple-400 font-mono"
              >
                #{blockNumber.toLocaleString()}
              </motion.span>
            )}
          </div>
        </div>

        {/* Gas Price */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <BanknotesIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-white font-medium">Gas Price</span>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              <motion.div
                key={gasPrice}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-yellow-400 font-mono">{gasPrice} ETH</span>
                <div className="text-xs text-gray-400">~{(parseFloat(gasPrice) * 1000000000).toFixed(0)} gwei</div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Chain ID */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <SignalIcon className="h-5 w-5 text-green-400" />
            <span className="text-white font-medium">Chain ID</span>
          </div>
          <span className="text-green-400 font-mono">84532</span>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="mt-6">
        <h4 className="text-white font-medium mb-3">ERC-8004 Contracts</h4>
        <div className="space-y-2">
          {[
            { name: 'Identity Registry', address: '0x1234...abcd' },
            { name: 'Reputation Registry', address: '0x5678...efgh' },
            { name: 'Validation Registry', address: '0x9012...ijkl' }
          ].map((contract, index) => (
            <motion.div
              key={contract.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-gray-700/20 rounded"
            >
              <span className="text-gray-300 text-sm">{contract.name}</span>
              <span className="text-blue-400 font-mono text-xs">{contract.address}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Network Stats */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-blue-400 font-medium">Network Health</h5>
          {isConnected && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs">Live</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-blue-300 mb-1">Block Time</div>
            <div className="text-blue-100 font-mono">~2s</div>
          </div>
          <div>
            <div className="text-blue-300 mb-1">Finality</div>
            <div className="text-blue-100 font-mono">~30s</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-center">
        <p className="text-gray-400 text-xs">
          Connected to {networkName} • Powered by Base L2
        </p>
      </div>
    </motion.div>
  );
}
