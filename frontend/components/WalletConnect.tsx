import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WalletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface WalletConnectProps {
  onWalletConnect: (address: string, web3Instance: any) => void;
  onWalletDisconnect: () => void;
  isConnected: boolean;
  currentAddress?: string;
}

declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
  }
}

export default function WalletConnect({ 
  onWalletConnect, 
  onWalletDisconnect, 
  isConnected, 
  currentAddress 
}: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [networkId, setNetworkId] = useState<number | null>(null);

  useEffect(() => {
    checkExistingConnection();
  }, []);

  useEffect(() => {
    if (isConnected && currentAddress) {
      updateBalance();
      updateNetworkInfo();
    }
  }, [isConnected, currentAddress]);

  const checkExistingConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const Web3 = (await import('web3')).default;
          const web3 = new Web3(window.ethereum);
          onWalletConnect(accounts[0], web3);
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    }
  };

  const updateBalance = async () => {
    if (!currentAddress || !window.ethereum) return;
    
    try {
      const Web3 = (await import('web3')).default;
      const web3 = new Web3(window.ethereum);
      const balanceWei = await web3.eth.getBalance(currentAddress);
      const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
      setBalance(parseFloat(balanceEth).toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const updateNetworkInfo = async () => {
    if (!window.ethereum) return;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setNetworkId(parseInt(chainId, 16));
    } catch (error) {
      console.error('Error fetching network info:', error);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Initialize Web3
      const Web3 = (await import('web3')).default;
      const web3 = new Web3(window.ethereum);
      
      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      // For Base Sepolia (84532) or Anvil (31337)
      const expectedChainIds = [84532, 31337, 8453]; // Base Sepolia, Anvil, Base Mainnet
      
      if (!expectedChainIds.includes(currentChainId)) {
        // Try to switch to Base Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x14a34' }], // Base Sepolia chain ID
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x14a34',
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
          }
        }
      }

      onWalletConnect(accounts[0], web3);

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onWalletDisconnect();
    setBalance('0');
    setNetworkId(null);
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 8453: return 'Base Mainnet';
      case 84532: return 'Base Sepolia';
      case 31337: return 'Anvil Local';
      default: return `Chain ${chainId}`;
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 1: return 'text-blue-400 border-blue-500/30 bg-blue-500/20';
      case 8453: return 'text-green-400 border-green-500/30 bg-green-500/20';
      case 84532: return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/20';
      case 31337: return 'text-purple-400 border-purple-500/30 bg-purple-500/20';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/20';
    }
  };

  if (isConnected && currentAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium">Wallet Connected</div>
              <div className="text-gray-400 text-sm font-mono">
                {currentAddress?.slice(0, 6)}...{currentAddress?.slice(-4)}
              </div>
            </div>
          </div>
          
          <button
            onClick={disconnectWallet}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Disconnect Wallet"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">Balance</div>
            <div className="text-white font-mono font-bold flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-400" />
              {balance} ETH
            </div>
          </div>
          
          {networkId && (
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Network</div>
              <div className={`text-xs font-medium px-2 py-1 rounded border ${getNetworkColor(networkId)}`}>
                {getNetworkName(networkId)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <div className="mb-4">
          <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <WalletIcon className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 text-sm">
            Connect MetaMask to use the AI code review service
          </p>
        </div>

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={`
            w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2
            ${isConnecting 
              ? 'bg-blue-600/50 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            } text-white
          `}
        >
          {isConnecting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              <span>Connect MetaMask</span>
            </>
          )}
        </button>

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <ShieldCheckIcon className="h-3 w-3" />
            <span>Secure connection via MetaMask</span>
          </div>
          <div>No private keys stored or transmitted</div>
        </div>
      </div>
    </motion.div>
  );
}
