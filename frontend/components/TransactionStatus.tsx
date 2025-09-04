import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  CurrencyDollarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface TransactionStatusProps {
  txHash: string | null;
  type: 'code_review' | 'validation';
  isWalletConnected: boolean;
  onConfirmed?: (receipt: any) => void;
}

export default function TransactionStatus({ 
  txHash, 
  type, 
  isWalletConnected,
  onConfirmed 
}: TransactionStatusProps) {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [gasUsed, setGasUsed] = useState<string | null>(null);
  const [etherscanUrl, setEtherscanUrl] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (txHash && txHash.startsWith('0x') && isWalletConnected) {
      trackTransaction();
    }
  }, [txHash]);

  const trackTransaction = async () => {
    if (!txHash || !txHash.startsWith('0x')) return;
    
    setIsTracking(true);
    setEtherscanUrl(`https://sepolia.basescan.org/tx/${txHash}`);
    
    // Poll for transaction confirmation
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts = 60 seconds
    
    while (attempts < maxAttempts) {
      try {
        // Prefer secure proxy calling Etherscan's proxy API (correct param: txhash)
        const response = await fetch(`/api/etherscan-proxy?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.result) {
            const receipt = data.result;
            
            if (receipt.status === '0x1') {
              // Transaction confirmed
              setStatus('confirmed');
              setBlockNumber(parseInt(receipt.blockNumber, 16));
              setGasUsed(parseInt(receipt.gasUsed, 16).toString());
              
              console.log(`🎉 Transaction confirmed in block ${parseInt(receipt.blockNumber, 16)}`);
              console.log(`💰 Gas used: ${parseInt(receipt.gasUsed, 16)}`);
              
              if (onConfirmed) {
                onConfirmed(receipt);
              }
              
              setIsTracking(false);
              return;
              
            } else if (receipt.status === '0x0') {
              // Transaction failed
              setStatus('failed');
              setIsTracking(false);
              return;
            }
          }
        }

        // Provider fallback (in case proxy rate-limits or lags)
        if (typeof (window as any).ethereum !== 'undefined') {
          try {
            const providerReceipt = await (window as any).ethereum.request({
              method: 'eth_getTransactionReceipt',
              params: [txHash]
            });
            if (providerReceipt && providerReceipt.blockNumber) {
              if (providerReceipt.status === '0x1' || providerReceipt.status === 1) {
                setStatus('confirmed');
                setBlockNumber(parseInt(providerReceipt.blockNumber, 16));
                setGasUsed(parseInt(providerReceipt.gasUsed, 16).toString());
                if (onConfirmed) onConfirmed(providerReceipt);
                setIsTracking(false);
                return;
              }
            }
          } catch (e) {
            // ignore provider fallback errors and continue polling
          }
        }
        
        // Still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
      } catch (error) {
        console.error('Transaction tracking error:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }
    
    // Timeout - assume failed
    console.warn('Transaction tracking timeout');
    setStatus('failed');
    setIsTracking(false);
  };

  if (!txHash || txHash.startsWith('free_') || txHash.startsWith('local_')) {
    return null; // No blockchain transaction to track
  }

  const getStatusIcon = () => {
    if (isTracking) return ClockIcon;
    switch (status) {
      case 'confirmed': return CheckCircleIcon;
      case 'failed': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = () => {
    if (isTracking) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`p-4 rounded-xl border ${getStatusColor()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isTracking ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <StatusIcon className="h-5 w-5" />
              </motion.div>
            ) : (
              <StatusIcon className="h-5 w-5" />
            )}
            
            <div>
              <h4 className="text-white font-medium">
                {type === 'code_review' ? 'Code Review Transaction' : 'Validation Transaction'}
              </h4>
              <p className="text-gray-400 text-sm">
                {isTracking ? 'Confirming on Base Sepolia...' :
                 status === 'confirmed' ? `Confirmed in block #${blockNumber}` :
                 status === 'failed' ? 'Transaction failed' :
                 'Processing...'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`font-medium capitalize ${getStatusColor().split(' ')[0]}`}>
              {isTracking ? 'Pending' : status}
            </div>
            
            {etherscanUrl && (
              <button
                onClick={() => window.open(etherscanUrl, '_blank')}
                className="mt-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
              >
                <EyeIcon className="h-3 w-3 inline mr-1" />
                BaseScan
              </button>
            )}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-400 mb-1">Transaction Hash</div>
              <div className="text-blue-400 font-mono break-all">
                {txHash.slice(0, 20)}...{txHash.slice(-10)}
              </div>
            </div>
            
            {gasUsed && (
              <div>
                <div className="text-gray-400 mb-1">Gas Used</div>
                <div className="text-gray-300 font-mono">
                  {parseInt(gasUsed).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {status === 'confirmed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded"
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-400" />
              <span className="text-green-300 text-sm">
                ✅ Real blockchain transaction confirmed! Revenue payment successful.
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
