import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  WalletIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface RegistrationStatus {
  isRegistered: boolean;
  agentId: number | null;
  walletAddress: string;
  isTEE: boolean;
  registrationFee: string;
  balance: string;
  needsFunding: boolean;
  error: string | null;
}

interface AgentRegistrationProps {
  web3Provider?: any;
  isWalletConnected?: boolean;
  onRegistrationSuccess?: (agentId: number) => void;
  onRegistrationComplete?: (agentId: number) => void;
}

export default function AgentRegistration({
  web3Provider,
  isWalletConnected,
  onRegistrationSuccess,
  onRegistrationComplete
}: AgentRegistrationProps) {
  const [status, setStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    agentId: null,
    walletAddress: '',
    isTEE: false,
    registrationFee: '0',
    balance: '0',
    needsFunding: false,
    error: null
  });
  const [isChecking, setIsChecking] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      setIsChecking(true);

      // Get wallet address from TEE environment
      const response = await fetch('http://localhost:8080/api/agent/info');
      if (!response.ok) {
        throw new Error('Failed to get agent info');
      }

      const agentInfo = await response.json();

      // Check if agent is registered on blockchain
      const registrationResponse = await fetch('http://localhost:8080/api/registration/status');
      if (!registrationResponse.ok) {
        throw new Error('Failed to check registration status');
      }

      const registrationData = await registrationResponse.json();

      setStatus({
        isRegistered: registrationData.isRegistered,
        agentId: registrationData.agentId,
        walletAddress: agentInfo.agent_address || '0x...',
        isTEE: agentInfo.tee_enabled || false,
        registrationFee: registrationData.registrationFee || '0.005',
        balance: registrationData.balance || '0',
        needsFunding: registrationData.needsFunding || false,
        error: null
      });

      if (registrationData.isRegistered && onRegistrationComplete) {
        onRegistrationComplete(registrationData.agentId);
      }

    } catch (error) {
      console.error('Registration check failed:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setIsChecking(false);
    }
  };

  const handleRegister = async () => {
    if (status.needsFunding) {
      alert(`Please fund your wallet address: ${status.walletAddress}`);
      return;
    }

    try {
      setIsRegistering(true);

      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          useTEE: status.isTEE
        })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const result = await response.json();

      if (result.success && result.agentId) {
        setStatus(prev => ({
          ...prev,
          isRegistered: true,
          agentId: result.agentId,
          error: null
        }));

        if (onRegistrationComplete) {
          onRegistrationComplete(result.agentId);
        }
      } else {
        throw new Error(result.error || 'Registration failed');
      }

    } catch (error) {
      console.error('Registration failed:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 max-w-md mx-auto text-center"
        >
          <ArrowPathIcon className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Checking Registration Status</h3>
          <p className="text-gray-400 text-sm">Initializing TEE agent...</p>
        </motion.div>
      </div>
    );
  }

  if (status.isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-green-500/30 p-8 max-w-md mx-auto text-center"
        >
          <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Agent Ready!</h2>
          <div className="space-y-3 text-left">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm">Agent ID</div>
              <div className="text-white font-mono">{status.agentId}</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm">Wallet Address</div>
              <div className="text-white font-mono text-xs">{status.walletAddress.slice(0, 20)}...</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm">Environment</div>
              <div className="text-white flex items-center">
                <CpuChipIcon className="h-4 w-4 mr-2" />
                {status.isTEE ? 'TEE Enabled' : 'Standard Mode'}
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-6 mb-4">
            Your ERC-8004 agent is registered and ready to provide code review services.
          </p>
          <p className="text-blue-400 text-sm">
            Redirecting to main application...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <CpuChipIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">ERC-8004 Agent Setup</h2>
          <p className="text-gray-400">Initialize your trustless AI agent</p>
        </div>

        <div className="space-y-6">
          {/* Wallet Address */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Wallet Address</span>
              <button
                onClick={() => copyToClipboard(status.walletAddress)}
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                Copy
              </button>
            </div>
            <div className="text-white font-mono text-sm break-all">
              {status.walletAddress}
            </div>
          </div>

          {/* Registration Fee */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-sm">Registration Fee</span>
                <div className="text-white font-mono">{status.registrationFee} ETH</div>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-sm">Your Balance</span>
                <div className={`font-mono ${status.needsFunding ? 'text-red-400' : 'text-green-400'}`}>
                  {status.balance} ETH
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <AnimatePresence>
            {status.needsFunding && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-medium mb-1">Funding Required</h4>
                    <p className="text-yellow-200 text-sm">
                      Please send {status.registrationFee} ETH to your wallet address above to register your agent.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {status.error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium mb-1">Setup Error</h4>
                    <p className="text-red-200 text-sm">{status.error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {status.isTEE && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <CpuChipIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-medium mb-1">TEE Environment Detected</h4>
                    <p className="text-blue-200 text-sm">
                      Running in Trusted Execution Environment with enhanced security.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.button
            onClick={handleRegister}
            disabled={status.needsFunding || isRegistering}
            className={`
              w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center space-x-2
              ${status.needsFunding || isRegistering
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
              } text-white
            `}
            whileHover={!status.needsFunding && !isRegistering ? { scale: 1.02 } : {}}
            whileTap={!status.needsFunding && !isRegistering ? { scale: 0.98 } : {}}
          >
            {isRegistering ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Registering Agent...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Register Agent</span>
              </>
            )}
          </motion.button>

          {/* Instructions */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-gray-300 text-sm">
                <h4 className="font-medium text-white mb-1">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Fund your wallet address with {status.registrationFee} ETH</li>
                  <li>Click "Register Agent" to deploy to blockchain</li>
                  <li>Your agent will be registered with ERC-8004 contracts</li>
                  <li>Once registered, the main application will load</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
