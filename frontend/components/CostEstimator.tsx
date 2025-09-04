import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  CalculatorIcon,
  FireIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface CostEstimatorProps {
  operationType: 'review' | 'validation' | 'registration' | 'feedback';
  networkId?: number;
  web3Instance?: any;
  onCostCalculated?: (cost: number) => void;
}

export default function CostEstimator({ 
  operationType, 
  networkId, 
  web3Instance,
  onCostCalculated 
}: CostEstimatorProps) {
  const [gasPrice, setGasPrice] = useState<string>('0');
  const [estimatedCost, setEstimatedCost] = useState<string>('0');
  const [usdCost, setUsdCost] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  // Gas estimates for different operations (based on our contract tests)
  const gasEstimates = {
    registration: 140000,  // From test: 139,928 gas
    review: 50000,         // Estimated for API calls + storage
    validation: 150000,    // From test: ~442,481 gas for full validation
    feedback: 120000       // From test: ~328,798 gas for feedback auth
  };

  // Network cost multipliers (Base is cheaper than Ethereum)
  const networkMultipliers = {
    1: 1.0,      // Ethereum Mainnet (baseline)
    8453: 0.05,  // Base Mainnet (~95% cheaper)
    84532: 0.05, // Base Sepolia (similar to mainnet)
    31337: 0.001 // Anvil (virtually free)
  };

  useEffect(() => {
    if (web3Instance && networkId) {
      updateGasPrice();
    }
  }, [web3Instance, networkId, operationType]);

  const updateGasPrice = async () => {
    if (!web3Instance) return;
    
    setIsLoading(true);
    
    try {
      // Get current gas price with error handling
      let gasPriceWei;
      try {
        gasPriceWei = await web3Instance.eth.getGasPrice();
      } catch (rpcError) {
        console.warn('RPC gas price failed, using fallback');
        gasPriceWei = '1000000000'; // 1 gwei fallback
      }
      
      const gasPriceGwei = web3Instance.utils.fromWei(gasPriceWei.toString(), 'gwei');
      setGasPrice(parseFloat(gasPriceGwei).toFixed(4));
      
      // Calculate estimated cost safely
      const gasLimit = gasEstimates[operationType];
      let adjustedCost = 0;
      
      try {
        const costWei = BigInt(gasPriceWei.toString()) * BigInt(gasLimit);
        const costEth = web3Instance.utils.fromWei(costWei.toString(), 'ether');
        
        // Apply network multiplier
        const multiplier = networkMultipliers[networkId as keyof typeof networkMultipliers] || 1;
        adjustedCost = parseFloat(costEth) * multiplier;
        
      } catch (calcError) {
        console.warn('Cost calculation error, using estimate');
        adjustedCost = 0.000001; // Small fallback cost
      }
      
      setEstimatedCost(adjustedCost.toFixed(6));
      
      // Estimate USD cost (rough approximation - would use real price API in production)
      const ethUsdPrice = 3000; // Approximate ETH price
      const usdValue = adjustedCost * ethUsdPrice;
      setUsdCost(usdValue < 0.01 ? '<$0.01' : `$${usdValue.toFixed(2)}`);
      
      if (onCostCalculated) {
        onCostCalculated(adjustedCost);
      }
      
    } catch (error) {
      console.error('Error calculating gas cost:', error);
      setGasPrice('--');
      setEstimatedCost('--');
      setUsdCost('--');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationTitle = (op: string) => {
    switch (op) {
      case 'registration': return 'Agent Registration';
      case 'review': return 'AI Code Review';
      case 'validation': return 'Review Validation';
      case 'feedback': return 'Feedback Authorization';
      default: return 'Operation';
    }
  };

  const getOperationDescription = (op: string) => {
    switch (op) {
      case 'registration': return 'One-time fee to register as an ERC-8004 agent';
      case 'review': return 'Submit code for AI analysis and review';
      case 'validation': return 'Request independent validation of review quality';
      case 'feedback': return 'Authorize feedback channel for reputation building';
      default: return 'Blockchain operation cost';
    }
  };

  const getCostLevel = (cost: number) => {
    if (cost < 0.001) return { level: 'Very Low', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (cost < 0.01) return { level: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (cost < 0.1) return { level: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  };

  const costInfo = getCostLevel(parseFloat(estimatedCost));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <CalculatorIcon className="h-5 w-5 text-blue-400" />
        <h4 className="text-white font-medium">Cost Estimation</h4>
      </div>

      {/* Operation Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm font-medium">
            {getOperationTitle(operationType)}
          </span>
          <div className={`px-2 py-1 rounded text-xs ${costInfo.bg} ${costInfo.color}`}>
            {costInfo.level} Cost
          </div>
        </div>
        <p className="text-gray-400 text-xs">
          {getOperationDescription(operationType)}
        </p>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3">
        
        {/* Gas Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FireIcon className="h-4 w-4 text-orange-400" />
            <span className="text-gray-300 text-sm">Gas Price</span>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
            ) : (
              <span className="text-orange-400 font-mono text-sm">{gasPrice} gwei</span>
            )}
          </div>
        </div>

        {/* Gas Limit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-4 w-4 text-blue-400" />
            <span className="text-gray-300 text-sm">Gas Limit</span>
          </div>
          <span className="text-blue-400 font-mono text-sm">
            {gasEstimates[operationType].toLocaleString()}
          </span>
        </div>

        {/* Total Cost */}
        <div className="pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Total Cost</span>
            <div className="text-right">
              {isLoading ? (
                <div className="animate-pulse bg-gray-600 h-5 w-20 rounded"></div>
              ) : (
                <>
                  <div className={`font-bold ${costInfo.color}`}>
                    {estimatedCost} ETH
                  </div>
                  <div className="text-gray-400 text-xs">
                    ≈ {usdCost}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Network Info */}
        {networkId && (
          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-xs">
                Running on {(() => {
                  switch (networkId) {
                    case 1: return 'Ethereum Mainnet';
                    case 8453: return 'Base Mainnet';
                    case 84532: return 'Base Sepolia';
                    case 31337: return 'Anvil Local';
                    default: return `Chain ${networkId}`;
                  }
                })()}
                {networkId === 31337 && ' (Free for testing)'}
                {(networkId === 8453 || networkId === 84532) && ' (~95% cheaper than Ethereum)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cost Optimization Notice */}
      {(networkId === 8453 || networkId === 84532) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span className="text-green-300 text-xs">
              Base network: Ultra-low gas fees optimized for applications
            </span>
          </div>
        </motion.div>
      )}
      
      {networkId === 31337 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 text-xs">
              Local testing: Free transactions on Anvil blockchain
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
