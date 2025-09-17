import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import ProperERC8004Interface from '../components/ProperERC8004Interface';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const ProperERC8004Page: React.FC = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [web3Provider, setWeb3Provider] = useState<ethers.BrowserProvider | null>(null);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask to use this application');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create Web3 provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check network - should be Base Sepolia (Chain ID: 84532)
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== 84532) {
        // Try to switch to Base Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x14A34' }], // 84532 in hex
          });
        } catch (switchError: any) {
          // Chain doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x14A34',
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
          } else {
            throw switchError;
          }
        }
      }

      setWeb3Provider(provider);
      setWalletAddress(address);
      setIsWalletConnected(true);

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      alert(`Failed to connect wallet: ${error.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Proper ERC-8004 Integration | Trustless AI Agents</title>
        <meta name="description" content="Proper ERC-8004 contract function integration - no generic ETH transfers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Proper ERC-8004 Integration
                </h1>
                <p className="text-gray-600 mt-1">
                  Calling exact contract functions - no generic ETH transfers
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Base Sepolia Network
                </div>
                <button
                  onClick={connectWallet}
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

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ProperERC8004Interface
            web3Provider={web3Provider || undefined}
            isWalletConnected={isWalletConnected}
            walletAddress={walletAddress}
          />
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-16">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">
                <strong>Proper ERC-8004 Implementation</strong> - Calling exact contract functions
              </p>
              <div className="flex justify-center gap-6">
                <span>✅ IdentityRegistry.newAgent() with 0.005 ETH</span>
                <span>✅ ValidationRegistry.validationRequest() FREE</span>
                <span>✅ ValidationRegistry.validationResponse() FREE</span>
                <span>✅ ReputationRegistry.acceptFeedback() FREE</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ProperERC8004Page;
