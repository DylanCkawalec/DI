import React from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
  TrophyIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface RevenueExplanationProps {
  userConfig?: {
    useOwnContracts?: boolean;
    identityRegistry?: string;
  };
  walletAddress?: string;
  isWalletConnected: boolean;
}

export default function RevenueExplanation({ 
  userConfig, 
  walletAddress, 
  isWalletConnected 
}: RevenueExplanationProps) {

  const isEarningRevenue = userConfig?.useOwnContracts && isWalletConnected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Revenue Model</h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
          isEarningRevenue 
            ? 'bg-green-500/20 border-green-500/30 text-green-400'
            : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
        }`}>
          {isEarningRevenue ? 'Earning Revenue' : 'Demo Mode'}
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        {isEarningRevenue ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <TrophyIcon className="h-6 w-6 text-green-400" />
              <div>
                <h4 className="text-green-300 font-bold">🎉 You're Earning Revenue!</h4>
                <p className="text-green-200 text-sm">
                  Users are paying YOUR contract: {userConfig.identityRegistry?.slice(0, 10)}...
                </p>
                <p className="text-green-100 text-xs mt-1">
                  Every code review generates revenue directly to your wallet
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <BanknotesIcon className="h-6 w-6 text-blue-400" />
              <div>
                <h4 className="text-blue-300 font-bold">Demo Mode Active</h4>
                <p className="text-blue-200 text-sm">
                  Using demo contracts - deploy your own to earn revenue
                </p>
                <p className="text-blue-100 text-xs mt-1">
                  Click "Deploy Your Protocol" to start earning
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Revenue Breakdown */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-4">💰 Revenue Streams</h4>
        
        <div className="space-y-3">
          {[
            { service: 'Code Review', fee: '0.0005 ETH', value: '~$1.50', frequency: 'Per analysis' },
            { service: 'AI Validation', fee: '0.001 ETH', value: '~$3.00', frequency: 'Per validation' },
            { service: 'Agent Registration', fee: '0.005 ETH', value: '~$15.00', frequency: 'One-time' }
          ].map((item, index) => (
            <motion.div
              key={item.service}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
            >
              <div>
                <div className="text-white font-medium">{item.service}</div>
                <div className="text-gray-400 text-sm">{item.frequency}</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-mono font-bold">{item.fee}</div>
                <div className="text-gray-400 text-sm">{item.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scaling Potential */}
      <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <h4 className="text-purple-400 font-bold mb-3 flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
          Scaling Potential
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-purple-300 mb-1">Monthly Scenarios:</div>
            <div className="space-y-1 text-purple-200">
              <div>100 reviews: 0.05 ETH (~$150)</div>
              <div>1,000 reviews: 0.5 ETH (~$1,500)</div>
              <div>10,000 reviews: 5 ETH (~$15,000)</div>
            </div>
          </div>
          <div>
            <div className="text-purple-300 mb-1">Growth Metrics:</div>
            <div className="space-y-1 text-purple-200">
              <div>99.99% cost advantage</div>
              <div>Infinite scalability</div>
              <div>Global developer market</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Transaction Info */}
      {isWalletConnected && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <h4 className="text-yellow-400 font-medium mb-3">🔄 Current Transaction Model</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Gas Fee (network):</span>
              <span className="text-gray-300">~$0.15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Owner Revenue:</span>
              <span className="text-green-400 font-bold">~$0.30</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-2">
              <span className="text-white font-medium">Total User Pays:</span>
              <span className="text-yellow-400 font-bold">~$0.45</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {isEarningRevenue 
                ? '✅ Revenue flows to YOUR wallet' 
                : '⚠️ Revenue flows to demo contract (deploy your own to earn)'}
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      {!isEarningRevenue && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const modal = document.querySelector('[data-launcher-modal]') as HTMLElement;
              if (modal) modal.click();
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
          >
            🚀 Start Earning Revenue - Deploy Your Protocol
          </button>
        </div>
      )}
    </motion.div>
  );
}
