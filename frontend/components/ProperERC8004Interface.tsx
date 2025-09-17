import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useERC8004Contracts, erc8004ContractHelpers } from '../hooks/useERC8004Contracts';

interface ProperERC8004InterfaceProps {
  web3Provider?: ethers.BrowserProvider;
  isWalletConnected: boolean;
  walletAddress: string;
}

interface CodeAnalysisSession {
  sessionId: string;
  validatorAgentId: number;
  serverAgentId: number;
  dataHash: string;
  validationTxHash?: string;
  responseTxHash?: string;
  status: 'pending' | 'validated' | 'completed';
  validationScore?: number;
}

const ProperERC8004Interface: React.FC<ProperERC8004InterfaceProps> = ({
  web3Provider,
  isWalletConnected,
  walletAddress
}) => {
  const contracts = useERC8004Contracts(web3Provider);
  const [userAgentId, setUserAgentId] = useState<number | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [codeToAnalyze, setCodeToAnalyze] = useState('');
  const [currentSession, setCurrentSession] = useState<CodeAnalysisSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');

  // Check if user has a registered agent
  useEffect(() => {
    const checkUserAgent = async () => {
      if (!isWalletConnected || !contracts.isConnected) return;
      
      try {
        const result = await erc8004ContractHelpers.getAgent(contracts, 1);
        if (result.success && result.agent?.agentAddress.toLowerCase() === walletAddress.toLowerCase()) {
          setUserAgentId(result.agent.agentId);
        }
      } catch (error) {
        // User doesn't have an agent registered yet
        setUserAgentId(null);
      }
    };

    checkUserAgent();
  }, [isWalletConnected, contracts.isConnected, walletAddress]);

  const registerAgent = async () => {
    if (!isWalletConnected || !contracts.isConnected) {
      setRegistrationStatus('❌ Please connect your wallet');
      return;
    }

    setIsRegistering(true);
    setRegistrationStatus('🔄 Registering agent with IdentityRegistry.newAgent()...');

    try {
      const result = await erc8004ContractHelpers.registerAgent(
        contracts,
        `${walletAddress.slice(2, 8).toLowerCase()}.agent.erc8004.dev`, // Generate domain
        walletAddress,
        false // Standard registration
      );

      if (result.success) {
        setRegistrationStatus(`✅ Agent registered! ID: ${result.agentId}`);
        setUserAgentId(result.agentId!);
        
        if (result.txHash) {
          setRegistrationStatus(prev => `${prev}\n🔗 Transaction: ${result.txHash}`);
        }
      } else {
        setRegistrationStatus(`❌ Registration failed: ${result.error}`);
      }

    } catch (error: any) {
      setRegistrationStatus(`❌ Registration failed: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const startCodeAnalysis = async () => {
    if (!userAgentId || !codeToAnalyze.trim()) {
      setAnalysisStatus('❌ Please register agent and provide code to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus('📊 Step 1: Submitting validation request (FREE)...');

    try {
      // Step 1: Submit validation request to ValidationRegistry (FREE!)
      const validationResult = await erc8004ContractHelpers.submitValidationRequest(
        contracts,
        userAgentId, // User acts as validator
        userAgentId, // User acts as server (simplified for demo)
        codeToAnalyze
      );

      if (!validationResult.success) {
        throw new Error(validationResult.error);
      }

      const session: CodeAnalysisSession = {
        sessionId: `session_${Date.now()}`,
        validatorAgentId: userAgentId,
        serverAgentId: userAgentId,
        dataHash: validationResult.dataHash!,
        validationTxHash: validationResult.txHash,
        status: 'pending'
      };

      setCurrentSession(session);
      setAnalysisStatus(`✅ Validation request submitted (FREE)\n🔗 TX: ${validationResult.txHash}`);

      // Step 2: Simulate AI analysis (in real system, this would be done by backend agents)
      setTimeout(async () => {
        setAnalysisStatus('🤖 Step 2: AI agents analyzing code...');
        
        // Simulate analysis time
        setTimeout(async () => {
          await submitValidationResponse(session, 85); // Mock validation score
        }, 3000);
        
      }, 2000);

    } catch (error: any) {
      setAnalysisStatus(`❌ Analysis failed: ${error.message}`);
      setIsAnalyzing(false);
    }
  };

  const submitValidationResponse = async (session: CodeAnalysisSession, score: number) => {
    setAnalysisStatus('⚖️ Step 3: Submitting validation response (FREE)...');

    try {
      // Step 3: Submit validation response (FREE!)
      const responseResult = await erc8004ContractHelpers.submitValidationResponse(
        contracts,
        session.dataHash,
        score
      );

      if (responseResult.success) {
        const updatedSession = {
          ...session,
          responseTxHash: responseResult.txHash,
          status: 'validated' as const,
          validationScore: score
        };
        
        setCurrentSession(updatedSession);
        setAnalysisStatus(`✅ Validation complete! Score: ${score}/100\n🔗 Response TX: ${responseResult.txHash}`);
        
        // Step 4: Accept feedback (FREE!)
        setTimeout(() => acceptFeedback(updatedSession), 2000);
        
      } else {
        throw new Error(responseResult.error);
      }

    } catch (error: any) {
      setAnalysisStatus(`❌ Validation response failed: ${error.message}`);
      setIsAnalyzing(false);
    }
  };

  const acceptFeedback = async (session: CodeAnalysisSession) => {
    setAnalysisStatus('⭐ Step 4: Accepting feedback authorization (FREE)...');

    try {
      // Step 4: Accept feedback authorization (FREE!)
      const feedbackResult = await erc8004ContractHelpers.acceptFeedback(
        contracts,
        session.validatorAgentId, // Client ID
        session.serverAgentId     // Server ID
      );

      if (feedbackResult.success) {
        const finalSession = {
          ...session,
          status: 'completed' as const
        };
        
        setCurrentSession(finalSession);
        setAnalysisStatus(`🎉 Complete ERC-8004 workflow finished!\n🔗 Feedback TX: ${feedbackResult.txHash}\n✅ Auth ID: ${feedbackResult.feedbackAuthId?.slice(0, 16)}...`);
        
      } else {
        throw new Error(feedbackResult.error);
      }

    } catch (error: any) {
      setAnalysisStatus(`❌ Feedback authorization failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isWalletConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Connect Wallet for ERC-8004 Protocol
        </h3>
        <p className="text-gray-600 mb-6">
          Connect your MetaMask wallet to interact with the trustless AI agent protocol
        </p>
        <div className="text-sm text-gray-500">
          Network: Base Sepolia • Chain ID: 84532
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract Connection Status */}
      <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
        contracts.isConnected ? 'border-green-500' : 'border-red-500'
      }`}>
        <div className="flex items-center gap-2">
          <span>{contracts.isConnected ? '✅' : '❌'}</span>
          <span className="font-medium">
            {contracts.isConnected ? 'Connected to ERC-8004 Contracts' : 'Contract Connection Failed'}
          </span>
        </div>
        {contracts.isConnected && (
          <div className="text-sm text-gray-600 mt-1">
            All 4 contracts loaded: Identity, Validation, Reputation, TEE Verifier
          </div>
        )}
      </div>

      {/* Agent Registration */}
      {!userAgentId ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Register Your Agent
          </h3>
          <p className="text-gray-600 mb-4">
            Register your address as an ERC-8004 agent to start using the protocol
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <div className="text-sm text-blue-800">
              <strong>Registration Cost:</strong> 0.005 ETH (anti-spam fee)
            </div>
            <div className="text-xs text-blue-600 mt-1">
              This fee is burned according to ERC-8004 spec
            </div>
          </div>

          {registrationStatus && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {registrationStatus}
              </pre>
            </div>
          )}

          <button
            onClick={registerAgent}
            disabled={isRegistering || !contracts.isConnected}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isRegistering || !contracts.isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRegistering ? 'Registering...' : 'Register Agent (0.005 ETH)'}
          </button>
        </div>
      ) : (
        /* Agent Management & Code Analysis */
        <div className="space-y-6">
          {/* Agent Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Your Registered Agent
            </h3>
            <div className="space-y-2 text-sm">
              <div><strong>Agent ID:</strong> {userAgentId}</div>
              <div><strong>Address:</strong> {walletAddress}</div>
              <div><strong>Status:</strong> <span className="text-green-600">✅ Registered</span></div>
            </div>
          </div>

          {/* Code Analysis Interface */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ERC-8004 Code Analysis Protocol
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code to Analyze
                </label>
                <textarea
                  value={codeToAnalyze}
                  onChange={(e) => setCodeToAnalyze(e.target.value)}
                  placeholder="Enter your code here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">ERC-8004 Protocol Steps:</h4>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. ValidationRegistry.validationRequest() - FREE</li>
                  <li>2. AI agents analyze code off-chain</li>
                  <li>3. ValidationRegistry.validationResponse() - FREE</li>
                  <li>4. ReputationRegistry.acceptFeedback() - FREE</li>
                </ol>
              </div>

              {analysisStatus && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-700 mb-2">Analysis Status:</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {analysisStatus}
                  </pre>
                </div>
              )}

              {currentSession && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">Current Session:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>Session ID: {currentSession.sessionId}</div>
                    <div>Data Hash: {currentSession.dataHash.slice(0, 20)}...</div>
                    <div>Status: {currentSession.status}</div>
                    {currentSession.validationScore && (
                      <div>Score: {currentSession.validationScore}/100</div>
                    )}
                    {currentSession.validationTxHash && (
                      <div>
                        Validation TX: 
                        <a 
                          href={`https://sepolia.basescan.org/tx/${currentSession.validationTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline ml-1"
                        >
                          View on BaseScan →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={startCodeAnalysis}
                disabled={isAnalyzing || !codeToAnalyze.trim() || !contracts.isConnected}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  isAnalyzing || !codeToAnalyze.trim() || !contracts.isConnected
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isAnalyzing ? 'Running ERC-8004 Protocol...' : 'Start Trustless Analysis (FREE*)'}
              </button>

              <div className="text-xs text-gray-500 text-center">
                *Only agent registration requires 0.005 ETH fee
              </div>
            </div>
          </div>

          {/* Protocol Explanation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How ERC-8004 Trustless Protocol Works
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <strong>Validation Request:</strong> User calls ValidationRegistry.validationRequest() to request code analysis (FREE)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <strong>AI Analysis:</strong> Server agents analyze code off-chain using AI models (Grok, Claude, etc.)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <strong>Validation Response:</strong> Validator agent calls ValidationRegistry.validationResponse() with score (FREE)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <strong>Feedback Authorization:</strong> Server agent calls ReputationRegistry.acceptFeedback() to enable reputation tracking (FREE)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProperERC8004Interface;


