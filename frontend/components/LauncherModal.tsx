import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RocketLaunchIcon,
  CogIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  XMarkIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface LauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchMode: (mode: string) => void;
}

export default function LauncherModal({ isOpen, onClose, onLaunchMode }: LauncherModalProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const launchModes = [
    {
      id: 'demo',
      icon: PlayIcon,
      title: 'Demo Mode',
      subtitle: 'Try for FREE',
      description: 'Experience the complete ERC-8004 A2A protocol',
      features: ['Full AI analysis', 'Professional UI', 'No wallet required', 'Complete workflow'],
      cost: 'FREE',
      color: 'blue'
    },
    {
      id: 'api_keys',
      icon: CpuChipIcon,
      title: 'Your AI Keys',
      subtitle: 'Use your credits',
      description: 'Use your own Grok/OpenAI/Claude API keys',
      features: ['Your AI credits', 'Cost control', 'Better models', 'Custom analysis'],
      cost: 'Your AI costs',
      color: 'green'
    },
    {
      id: 'own_contracts',
      icon: CurrencyDollarIcon,
      title: 'Your Contracts',
      subtitle: 'Earn revenue',
      description: 'Deploy your own ERC-8004 contracts',
      features: ['YOU earn revenue', 'Protocol ownership', 'Base Sepolia', 'Professional business'],
      cost: '~$0.45 total',
      color: 'purple'
    },
    {
      id: 'full_deployment',
      icon: RocketLaunchIcon,
      title: 'Full Deployment',
      subtitle: 'Complete ownership',
      description: 'Your contracts + your API keys',
      features: ['Complete independence', 'Maximum revenue', 'Full control', 'Scale globally'],
      cost: '~$0.45 + AI costs',
      color: 'yellow'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400',
      green: 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400',
      purple: 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400',
      yellow: 'border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleLaunch = () => {
    if (selectedMode) {
      onLaunchMode(selectedMode);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 max-w-4xl w-full max-h-90vh overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <RocketLaunchIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Deploy Your ERC-8004 Protocol</h2>
                  <p className="text-gray-400">Choose your deployment mode and start earning revenue</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {launchModes.map((mode) => {
                const IconComponent = mode.icon;
                const isSelected = selectedMode === mode.id;
                
                return (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`
                      relative p-6 rounded-xl border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? `${getColorClasses(mode.color)} border-opacity-100 bg-opacity-30` 
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }
                    `}
                    onClick={() => setSelectedMode(mode.id)}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                      >
                        <ShieldCheckIcon className="h-4 w-4 text-white" />
                      </motion.div>
                    )}

                    {/* Mode Content */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`p-3 rounded-lg ${getColorClasses(mode.color).split(' ')[1]}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{mode.title}</h3>
                        <p className={`text-sm font-medium mb-2 ${getColorClasses(mode.color).split(' ')[3]}`}>
                          {mode.subtitle}
                        </p>
                        <p className="text-gray-300 text-sm">{mode.description}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {mode.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cost */}
                    <div className="pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Total Cost:</span>
                        <span className={`font-bold ${getColorClasses(mode.color).split(' ')[3]}`}>
                          {mode.cost}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Revenue Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6 mb-8"
            >
              <h3 className="text-green-400 font-bold mb-3 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Revenue Model Explanation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-white font-medium mb-2">💰 How You Earn Revenue:</h4>
                  <ul className="space-y-1 text-green-200">
                    <li>• Users pay fees to YOUR smart contracts</li>
                    <li>• Code reviews: 0.0005 ETH → YOUR wallet</li>
                    <li>• Validations: 0.001 ETH → YOUR wallet</li>
                    <li>• Agent registrations: 0.005 ETH → YOUR wallet</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">🚀 Business Potential:</h4>
                  <ul className="space-y-1 text-blue-200">
                    <li>• 1,000 reviews/month = 0.5 ETH revenue</li>
                    <li>• Scale to millions of developers</li>
                    <li>• 99.99% cheaper than traditional audits</li>
                    <li>• Complete protocol ownership</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Maybe Later
              </button>
              
              <button
                onClick={handleLaunch}
                disabled={!selectedMode}
                className={`
                  px-8 py-3 rounded-lg font-medium transition-all flex items-center space-x-2
                  ${selectedMode
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105'
                    : 'bg-gray-600 cursor-not-allowed text-gray-400'
                  }
                `}
              >
                <RocketLaunchIcon className="h-5 w-5" />
                <span>{selectedMode ? `Launch ${launchModes.find(m => m.id === selectedMode)?.title}` : 'Select Mode First'}</span>
              </button>
            </div>

            {/* Quick Stats */}
            {selectedMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gray-800/50 rounded-xl"
              >
                <h4 className="text-white font-medium mb-3">📊 What You Get:</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">99.99%</div>
                    <div className="text-xs text-gray-400">Cost Reduction</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">30s</div>
                    <div className="text-xs text-gray-400">vs 6 weeks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">∞</div>
                    <div className="text-xs text-gray-400">Scalability</div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
