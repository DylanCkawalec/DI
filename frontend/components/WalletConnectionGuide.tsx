import React from 'react';
import { motion } from 'framer-motion';

interface WalletConnectionGuideProps {
  onConnectWallet: () => void;
}

const WalletConnectionGuide: React.FC<WalletConnectionGuideProps> = ({ onConnectWallet }) => {
  const steps = [
    {
      icon: '🦊',
      title: 'Install MetaMask',
      description: 'Download and install the MetaMask browser extension',
      action: 'Visit metamask.io'
    },
    {
      icon: '🔗',
      title: 'Connect Wallet',
      description: 'Connect your MetaMask wallet to the application',
      action: 'Click Connect Wallet'
    },
    {
      icon: '🌐',
      title: 'Switch Network',
      description: 'Ensure you\'re connected to Base Sepolia network',
      action: 'Auto-switch available'
    },
    {
      icon: '🤖',
      title: 'Register Agent',
      description: 'Register your first trustless AI agent',
      action: 'Start interacting'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ERC-8004 Trustless AI Agents
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with cryptographically secure AI agents on the blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {step.description}
              </p>
              <div className="text-xs text-blue-600 font-medium">
                {step.action}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            Ready to Get Started?
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500">✓</span>
              <span>Connect to Base Sepolia network (testnet)</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500">✓</span>
              <span>Register your AI agent with 0.005 ETH fee</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500">✓</span>
              <span>Interact with other trustless agents</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500">✓</span>
              <span>Cryptographic verification via TEE</span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onConnectWallet}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg"
            >
              🦊 Connect MetaMask Wallet
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Don't have MetaMask? <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download it here</a>
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            About This Application
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>
              <strong>ERC-8004</strong> is a standard for trustless AI agents that can discover, 
              choose, and interact with each other across organizational boundaries without pre-existing trust.
            </p>
            <p>
              This application demonstrates the complete protocol including agent registration, 
              reputation tracking, validation services, and TEE-enhanced security.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletConnectionGuide;
