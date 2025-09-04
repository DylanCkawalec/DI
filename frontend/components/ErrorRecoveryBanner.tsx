import React from 'react';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ErrorRecoveryBannerProps {
  networkId?: number | null;
  isWalletConnected: boolean;
}

export default function ErrorRecoveryBanner({ networkId, isWalletConnected }: ErrorRecoveryBannerProps) {
  const isCorrectNetwork = networkId === 84532; // Base Sepolia
  
  // Show different banners based on connection status
  if (!isWalletConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div>
            <div className="text-blue-300 font-medium text-sm">No Wallet Connected</div>
            <div className="text-blue-200 text-xs">
              Connect MetaMask for blockchain features, or use local analysis mode
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (!isCorrectNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div>
            <div className="text-yellow-300 font-medium text-sm">Switch to Base Sepolia</div>
            <div className="text-yellow-200 text-xs">
              Switch MetaMask to Base Sepolia for blockchain features, or continue with local analysis
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
    >
      <div className="flex items-center space-x-3">
        <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
        <div>
          <div className="text-green-300 font-medium text-sm">Connected to Base Sepolia</div>
          <div className="text-green-200 text-xs">
            Full blockchain integration active. If you see JSON errors, analysis will continue locally.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
