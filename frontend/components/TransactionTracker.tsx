import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LinkIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  hash: string;
  type: 'code_review' | 'validation' | 'agent_registration';
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  value?: string;
  timestamp?: number;
  etherscanUrl?: string;
  ownerRevenue?: string;
}

interface TransactionTrackerProps {
  walletAddress: string;
  etherscanApiKey?: string;
}

export default function TransactionTracker({ 
  walletAddress, 
  etherscanApiKey 
}: TransactionTrackerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState('0');

  useEffect(() => {
    if (walletAddress) {
      loadTransactionHistory();
    }
  }, [walletAddress]);

  const loadTransactionHistory = async () => {
    setIsLoading(true);
    
    try {
      // Use secure API proxy instead of direct Etherscan calls
      const response = await fetch(
        `/api/etherscan-proxy?address=${walletAddress}&module=account&action=txlist`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const enhancedTxs = data.result
          .filter((tx: any) => 
            // Filter for our contract interactions
            tx.to === '0x35656CaD817aD468260dE1bA029fF919E5a40f75' || // IdentityRegistry
            tx.to === '0x6731b3be764B33a4E94D148410f1f551CE91dA61'    // ValidationRegistry
          )
          .map((tx: any) => ({
            hash: tx.hash,
            type: tx.to === '0x35656CaD817aD468260dE1bA029fF919E5a40f75' ? 'code_review' : 'validation',
            status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
            blockNumber: parseInt(tx.blockNumber),
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            value: tx.value,
            timestamp: parseInt(tx.timeStamp),
            etherscanUrl: `https://sepolia.basescan.org/tx/${tx.hash}`,
            ownerRevenue: calculateOwnerRevenue(tx.value, tx.type)
          }));
        
        setTransactions(enhancedTxs.slice(0, 10)); // Latest 10 transactions
        
        // Calculate total revenue
        const revenue = enhancedTxs.reduce((total: number, tx: any) => {
          return total + parseFloat(tx.ownerRevenue || '0');
        }, 0);
        
        setTotalRevenue(revenue.toFixed(6));
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOwnerRevenue = (value: string, type: string) => {
    // Calculate the owner revenue portion from the total transaction value
    const totalValue = parseFloat(value) / 1e18; // Convert from wei to ETH
    
    if (type === 'code_review') {
      return (totalValue * 0.8).toFixed(6); // ~80% goes to owner after gas
    } else if (type === 'validation') {
      return (totalValue * 0.85).toFixed(6); // ~85% goes to owner after gas
    }
    
    return '0';
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'code_review': return CurrencyDollarIcon;
      case 'validation': return CheckCircleIcon;
      default: return DocumentDuplicateIcon;
    }
  };

  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'code_review': return 'Code Review';
      case 'validation': return 'Validation';
      default: return 'Transaction';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
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
          <LinkIcon className="h-6 w-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Blockchain Transactions</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Revenue</div>
            <div className="text-green-400 font-mono font-bold">
              {totalRevenue} ETH
            </div>
          </div>
          
          <button
            onClick={loadTransactionHistory}
            disabled={isLoading}
            className="p-2 bg-blue-500/20 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {transactions.filter(tx => tx.type === 'code_review').length}
          </div>
          <div className="text-xs text-gray-400">Code Reviews</div>
        </div>
        
        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {transactions.filter(tx => tx.type === 'validation').length}
          </div>
          <div className="text-xs text-gray-400">Validations</div>
        </div>
        
        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {transactions.filter(tx => tx.status === 'confirmed').length}
          </div>
          <div className="text-xs text-gray-400">Confirmed</div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            {isLoading ? (
              <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            ) : (
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            )}
            <p className="text-gray-400">
              {isLoading ? 'Loading transaction history...' : 'No transactions found'}
            </p>
            <p className="text-gray-500 text-sm">
              Submit a code review to see your transactions
            </p>
          </div>
        ) : (
          transactions.map((tx, index) => {
            const TypeIcon = getTransactionTypeIcon(tx.type);
            
            return (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TypeIcon className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">
                        {getTransactionTypeName(tx.type)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(tx.timestamp! * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </div>
                    {tx.ownerRevenue && parseFloat(tx.ownerRevenue) > 0 && (
                      <div className="text-green-400 text-sm font-mono">
                        +{tx.ownerRevenue} ETH
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-gray-400 mb-1">Transaction Hash</div>
                      <div className="text-blue-400 font-mono break-all">
                        {tx.hash.slice(0, 20)}...
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 mb-1">Block Number</div>
                      <div className="text-gray-300 font-mono">
                        #{tx.blockNumber}
                      </div>
                    </div>
                  </div>
                  
                  {/* Etherscan Link */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => window.open(tx.etherscanUrl, '_blank')}
                      className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      View on BaseScan →
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Etherscan Integration Info */}
      <div className="mt-6 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-4 w-4 text-green-400" />
          <span className="text-green-300 text-sm">
            Real-time blockchain verification via Etherscan API
          </span>
        </div>
      </div>
    </motion.div>
  );
}
