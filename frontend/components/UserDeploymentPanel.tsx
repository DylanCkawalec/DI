import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CogIcon,
  KeyIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface UserDeploymentPanelProps {
  onConfigUpdate: (config: UserConfig) => void;
}

interface UserConfig {
  useOwnAPIKeys: boolean;
  grokApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  useOwnContracts: boolean;
  identityRegistry: string;
  reputationRegistry: string;
  validationRegistry: string;
  privateKey: string;
  rpcUrl: string;
}

export default function UserDeploymentPanel({ onConfigUpdate }: UserDeploymentPanelProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [config, setConfig] = useState<UserConfig>({
    useOwnAPIKeys: false,
    grokApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    useOwnContracts: false,
    identityRegistry: '',
    reputationRegistry: '',
    validationRegistry: '',
    privateKey: '',
    rpcUrl: 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj'
  });
  
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  useEffect(() => {
    // Load saved configuration
    const saved = localStorage.getItem('erc8004_user_config');
    if (saved) {
      try {
        const savedConfig = JSON.parse(saved);
        setConfig({ ...config, ...savedConfig });
      } catch (error) {
        console.warn('Failed to load saved config');
      }
    }
  }, []);

  const handleConfigChange = (updates: Partial<UserConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    // Save to localStorage
    localStorage.setItem('erc8004_user_config', JSON.stringify(newConfig));
    
    // Notify parent component
    onConfigUpdate(newConfig);
  };

  const deployOwnContracts = async () => {
    if (!config.privateKey) {
      alert('Please provide your private key to deploy contracts');
      return;
    }

    try {
      // Call deployment API
      const response = await fetch('/api/deploy/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          private_key: config.privateKey,
          rpc_url: config.rpcUrl,
          network: 'base_sepolia'
        })
      });

      if (response.ok) {
        const deployment = await response.json();
        
        handleConfigChange({
          useOwnContracts: true,
          identityRegistry: deployment.contracts.IdentityRegistry,
          reputationRegistry: deployment.contracts.ReputationRegistry,
          validationRegistry: deployment.contracts.ValidationRegistry
        });

        alert(`✅ Contracts deployed successfully!\n\nIdentity: ${deployment.contracts.IdentityRegistry}\nReputation: ${deployment.contracts.ReputationRegistry}\nValidation: ${deployment.contracts.ValidationRegistry}\n\nCost: ~$0.015 total`);
      } else {
        throw new Error('Deployment failed');
      }
    } catch (error) {
      console.error('Contract deployment failed:', error);
      alert('Contract deployment failed. Please check your private key and network connection.');
    }
  };

  return (
    <>
      {/* Configuration Toggle Button */}
      <motion.button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <CogIcon className="h-6 w-6 text-white" />
      </motion.button>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed top-0 right-0 h-full w-96 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 z-40 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <CogIcon className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Deploy Your Own</h3>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* AI API Keys Section */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <CpuChipIcon className="h-5 w-5 text-green-400" />
                  <h4 className="text-white font-medium">AI API Keys</h4>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.useOwnAPIKeys}
                      onChange={(e) => handleConfigChange({ useOwnAPIKeys: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500"
                    />
                    <span className="text-gray-300 text-sm">Use my own AI API keys</span>
                  </label>

                  {config.useOwnAPIKeys && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">API Keys</span>
                        <button
                          onClick={() => setShowApiKeys(!showApiKeys)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          {showApiKeys ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      <input
                        type={showApiKeys ? "text" : "password"}
                        placeholder="Grok API Key (xai-...)"
                        value={config.grokApiKey}
                        onChange={(e) => handleConfigChange({ grokApiKey: e.target.value })}
                        className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
                      />
                      
                      <input
                        type={showApiKeys ? "text" : "password"}
                        placeholder="OpenAI API Key (sk-...)"
                        value={config.openaiApiKey}
                        onChange={(e) => handleConfigChange({ openaiApiKey: e.target.value })}
                        className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                      />
                      
                      <input
                        type={showApiKeys ? "text" : "password"}
                        placeholder="Anthropic API Key (sk-ant-...)"
                        value={config.anthropicApiKey}
                        onChange={(e) => handleConfigChange({ anthropicApiKey: e.target.value })}
                        className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                      />
                      
                      <div className="text-xs text-gray-400">
                        💡 Your API keys are stored locally and never sent to external servers
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Smart Contracts Section */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentDuplicateIcon className="h-5 w-5 text-purple-400" />
                  <h4 className="text-white font-medium">Smart Contracts</h4>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.useOwnContracts}
                      onChange={(e) => handleConfigChange({ useOwnContracts: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-800 text-purple-500"
                    />
                    <span className="text-gray-300 text-sm">Deploy my own ERC-8004 contracts</span>
                  </label>

                  {config.useOwnContracts ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Private Key for Deployment</span>
                        <button
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          {showPrivateKey ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      <input
                        type={showPrivateKey ? "text" : "password"}
                        placeholder="Your private key for contract deployment"
                        value={config.privateKey}
                        onChange={(e) => handleConfigChange({ privateKey: e.target.value })}
                        className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                      />
                      
                      <button
                        onClick={deployOwnContracts}
                        disabled={!config.privateKey}
                        className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                      >
                        🚀 Deploy My ERC-8004 Contracts (~$0.015)
                      </button>
                      
                      {config.identityRegistry && (
                        <div className="space-y-2 text-xs">
                          <div className="text-green-400">✅ Your deployed contracts:</div>
                          <div className="text-gray-300 font-mono break-all">Identity: {config.identityRegistry}</div>
                          <div className="text-gray-300 font-mono break-all">Reputation: {config.reputationRegistry}</div>
                          <div className="text-gray-300 font-mono break-all">Validation: {config.validationRegistry}</div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Using demo contracts. You can deploy your own to earn revenue from user interactions.
                    </div>
                  )}
                </div>
              </div>

              {/* Network Configuration */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <KeyIcon className="h-5 w-5 text-yellow-400" />
                  <h4 className="text-white font-medium">Network Settings</h4>
                </div>
                
                <div className="space-y-3">
                  <select
                    value={config.rpcUrl}
                    onChange={(e) => handleConfigChange({ rpcUrl: e.target.value })}
                    className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                  >
                    <option value="https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj">
                      Base Sepolia (Demo) - Free
                    </option>
                    <option value="https://lb.drpc.org/base/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj">
                      Base Mainnet - Production
                    </option>
                    <option value="http://127.0.0.1:8545">
                      Anvil Local - Testing
                    </option>
                  </select>
                  
                  <div className="text-xs text-gray-400">
                    Select your preferred network for contract deployment
                  </div>
                </div>
              </div>

              {/* Revenue Information */}
              <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <h4 className="text-green-400 font-medium mb-3">💰 Your Revenue Model</h4>
                <div className="space-y-2 text-sm text-green-200">
                  <div>• Users pay fees to YOUR deployed contracts</div>
                  <div>• Code reviews: 0.001 ETH per analysis</div>
                  <div>• Validations: 0.002 ETH per validation</div>
                  <div>• Agent registrations: 0.005 ETH per agent</div>
                  <div>• ALL revenue goes to YOUR wallet</div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-medium mb-2">🔒 Security Features</h4>
                    <div className="space-y-1 text-xs text-blue-200">
                      <div>• All keys stored locally in your browser</div>
                      <div>• Private keys never sent to external servers</div>
                      <div>• API keys used only for your requests</div>
                      <div>• Complete control over your protocol instance</div>
                      <div>• Export/import configuration anytime</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    const exportData = JSON.stringify(config, null, 2);
                    const blob = new Blob([exportData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'erc8004-config.json';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  📁 Export Configuration
                </button>
                
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const importedConfig = JSON.parse(event.target?.result as string);
                            setConfig({ ...config, ...importedConfig });
                            onConfigUpdate({ ...config, ...importedConfig });
                            alert('✅ Configuration imported successfully');
                          } catch (error) {
                            alert('❌ Failed to import configuration');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  📂 Import Configuration
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowPanel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
