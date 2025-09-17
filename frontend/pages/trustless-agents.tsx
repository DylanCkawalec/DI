import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import TrustlessAgentInterface from '../components/TrustlessAgentInterface';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const TrustlessAgentsPage: React.FC = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [web3Provider, setWeb3Provider] = useState<any>(null);
  const [networkError, setNetworkError] = useState<string>('');

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

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
      setNetworkError('');

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsWalletConnected(false);
          setWalletAddress('');
          setWeb3Provider(null);
        } else {
          setWalletAddress(accounts[0]);
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      if (error.code === 4001) {
        alert('Please connect your wallet to continue');
      } else if (error.code === -32002) {
        alert('Please check MetaMask - there may be a pending connection request');
      } else {
        alert(`Failed to connect wallet: ${error.message}`);
      }
    }
  };

  return (
    <>
      <Head>
        <title>ERC-8004 Trustless AI Agents</title>
        <meta name="description" content="Register and interact with trustless AI agents using the ERC-8004 protocol" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {networkError && (
        <div className="bg-red-50 border border-red-200 p-4 text-center">
          <p className="text-red-700">{networkError}</p>
          <button
            onClick={connectWallet}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      <TrustlessAgentInterface
        web3Provider={web3Provider}
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        onConnect={connectWallet}
      />
    </>
  );
};

export default TrustlessAgentsPage;
