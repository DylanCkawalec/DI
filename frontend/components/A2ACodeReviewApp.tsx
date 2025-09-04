import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CodeBracketIcon,
  SparklesIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  KeyIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import WalletConnect from './WalletConnect';
import CostEstimator from './CostEstimator';

interface A2ASession {
  session_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  cost_eth: number;
  transaction_count: number;
  has_encrypted_payload: boolean;
  agent_address: string;
  user_address: string;
}

interface AnalysisResult {
  session_id: string;
  analysis_result: {
    security_score: number;
    performance_score: number;
    maintainability_score: number;
    overall_score: number;
    issues: Array<{
      type: string;
      message: string;
      severity: string;
      line?: number;
    }>;
    recommendations: string[];
  };
  agent_signature: string;
  timestamp: string;
  agent_address: string;
}

export default function A2ACodeReviewApp() {
  // Wallet state
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [web3Instance, setWeb3Instance] = useState<any>(null);
  const [networkId, setNetworkId] = useState<number | null>(null);

  // Application state
  const [prompt, setPrompt] = useState('');
  const [codeToReview, setCodeToReview] = useState('');
  const [language, setLanguage] = useState('python');
  const [currentSession, setCurrentSession] = useState<A2ASession | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [userSessions, setUserSessions] = useState<A2ASession[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Polling for session updates
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);

  const sampleCode = `import os
import subprocess  
from flask import Flask, request

app = Flask(__name__)

@app.route('/execute')
def execute_command():
    # Security vulnerability: command injection
    cmd = request.args.get('cmd')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

@app.route('/read_file')
def read_file():
    # Security vulnerability: path traversal
    filename = request.args.get('file')
    with open(filename, 'r') as f:
        return f.read()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Debug in production`;

  // Wallet handlers
  const handleWalletConnect = async (address: string, web3: any) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
    setWeb3Instance(web3);
    
    try {
      const chainId = await web3.eth.getChainId();
      setNetworkId(chainId);
      
      // Load user sessions
      await loadUserSessions(address);
    } catch (error) {
      console.error('Error setting up wallet:', error);
    }
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    setWeb3Instance(null);
    setNetworkId(null);
    setCurrentSession(null);
    setAnalysisResult(null);
    setUserSessions([]);
  };

  // Load user's previous sessions
  const loadUserSessions = async (userAddress: string) => {
    try {
      const response = await fetch(`/api/sessions?user=${userAddress}`);
      if (response.ok) {
        const sessions = await response.json();
        setUserSessions(sessions);
        
        // Store in browser storage
        localStorage.setItem(`erc8004_sessions_${userAddress}`, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Failed to load user sessions:', error);
      
      // Try loading from browser storage
      const stored = localStorage.getItem(`erc8004_sessions_${userAddress}`);
      if (stored) {
        setUserSessions(JSON.parse(stored));
      }
    }
  };

  // Submit code review request through A2A protocol
  const submitCodeReview = async () => {
    if (!isWalletConnected || !prompt.trim() || !codeToReview.trim()) {
      alert('Please connect wallet and provide both prompt and code');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create A2A session
      const sessionResponse = await fetch('/api/a2a/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: walletAddress,
          prompt: prompt,
          code: codeToReview,
          language: language,
          user_public_key: walletAddress // Using address as public key identifier
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create A2A session');
      }

      const session = await sessionResponse.json();
      setCurrentSession(session);
      
      // Store session in browser
      const existingSessions = JSON.parse(localStorage.getItem(`erc8004_sessions_${walletAddress}`) || '[]');
      existingSessions.push(session);
      localStorage.setItem(`erc8004_sessions_${walletAddress}`, JSON.stringify(existingSessions));
      
      // Start polling for updates
      startSessionPolling(session.session_id);
      
      // Show success message
      console.log(`✅ A2A session created: ${session.session_id}`);
      
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit code review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll for session status updates
  const startSessionPolling = useCallback(async (sessionId: string) => {
    const pollSession = async () => {
      try {
        const response = await fetch(`/api/a2a/session-status?id=${sessionId}`);
        if (response.ok) {
          const status = await response.json();
          setCurrentSession(status);
          setLastPollTime(new Date());
          
          // If completed, try to fetch results
          if (status.status === 'completed' && status.has_encrypted_payload) {
            console.log('🎉 Session completed, encrypted payload available');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    await pollSession();
    
    // Continue polling every 15 seconds while session is active
    const intervalId = setInterval(async () => {
      await pollSession();
    }, 15000);

    // Cleanup interval when session completes
    setTimeout(() => {
      clearInterval(intervalId);
    }, 300000); // 5 minute timeout
    
  }, []);

  // Decrypt payload with user signature
  const decryptPayload = async () => {
    if (!currentSession || !web3Instance) return;
    
    setIsDecrypting(true);
    
    try {
      // Create signature for payload access
      const message = `ERC-8004 Access Session ${currentSession.session_id}`;
      const signature = await web3Instance.eth.personal.sign(message, walletAddress, '');
      
      // Request decrypted payload
      const response = await fetch('/api/a2a/decrypt-payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          user_address: walletAddress,
          user_signature: signature
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        console.log('✅ Payload decrypted successfully');
      } else {
        throw new Error('Failed to decrypt payload');
      }
      
    } catch (error) {
      console.error('Decryption failed:', error);
      alert('Failed to decrypt results. Please try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Initialize sample data
  useEffect(() => {
    if (!codeToReview) {
      setCodeToReview(sampleCode);
      setPrompt('Please analyze this Flask web application for security vulnerabilities, performance issues, and provide recommendations for improvement. Focus on potential command injection, path traversal, and production security best practices.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <CodeBracketIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ERC-8004 A2A Code Review</h1>
              <p className="text-sm text-gray-400">Trustless AI Agent Protocol</p>
            </div>
          </div>
          
          <WalletConnect
            onWalletConnect={handleWalletConnect}
            onWalletDisconnect={handleWalletDisconnect}
            isConnected={isWalletConnected}
            currentAddress={walletAddress}
          />
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Prompt Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Analysis Prompt</h3>
              </div>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want the AI to analyze in your code..."
                className="w-full h-24 p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              />
            </motion.div>

            {/* Code Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <CodeBracketIcon className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Code to Review</h3>
                </div>
                
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="solidity">Solidity</option>
                </select>
              </div>
              
              <textarea
                value={codeToReview}
                onChange={(e) => setCodeToReview(e.target.value)}
                placeholder={`Enter your ${language} code here...`}
                className="w-full h-64 p-4 bg-gray-900 text-white font-mono text-sm rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none resize-none"
                spellCheck={false}
              />
              
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => {
                    setCodeToReview(sampleCode);
                    setPrompt('Please analyze this Flask web application for security vulnerabilities, performance issues, and provide recommendations for improvement.');
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Load Sample Vulnerable Code
                </button>
                
                <div className="text-xs text-gray-400">
                  Lines: {codeToReview.split('\n').length} | Chars: {codeToReview.length}
                </div>
              </div>
            </motion.div>

            {/* Submit Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium mb-1">Ready to Submit?</h4>
                  <p className="text-gray-400 text-sm">
                    Your code will be analyzed by AI agents using the A2A protocol
                  </p>
                </div>
                
                <button
                  onClick={submitCodeReview}
                  disabled={!isWalletConnected || isSubmitting || !prompt.trim() || !codeToReview.trim()}
                  className={`
                    px-8 py-3 rounded-lg font-medium transition-all flex items-center space-x-2
                    ${(!isWalletConnected || isSubmitting || !prompt.trim() || !codeToReview.trim())
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      <span>Submitting to A2A...</span>
                    </>
                  ) : !isWalletConnected ? (
                    <>
                      <KeyIcon className="h-4 w-4" />
                      <span>Connect Wallet First</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" />
                      <span>Submit for AI Review</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Status & Results Panel */}
          <div className="space-y-6">
            
            {/* Cost Estimation */}
            {isWalletConnected && (
              <CostEstimator
                operationType="review"
                networkId={networkId || undefined}
                web3Instance={web3Instance}
              />
            )}

            {/* Current Session Status */}
            {currentSession && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-xl font-semibold text-white">A2A Session</h3>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    currentSession.status === 'completed' 
                      ? 'bg-green-500/20 border-green-500/30 text-green-400'
                      : currentSession.status === 'processing'
                      ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                      : currentSession.status === 'failed'
                      ? 'bg-red-500/20 border-red-500/30 text-red-400'
                      : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                  }`}>
                    {currentSession.status}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Session ID:</span>
                    <span className="text-blue-400 font-mono">{currentSession.session_id}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Cost:</span>
                    <span className="text-green-400 font-mono">{currentSession.cost_eth.toFixed(6)} ETH</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Transactions:</span>
                    <span className="text-purple-400">{currentSession.transaction_count}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Updated:</span>
                    <span className="text-gray-300">
                      {new Date(currentSession.updated_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Encrypted Payload Access */}
                {currentSession.status === 'completed' && currentSession.has_encrypted_payload && !analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-green-400 font-medium">Results Ready!</h4>
                        <p className="text-green-200 text-sm">
                          Encrypted payload available. Sign to decrypt your results.
                        </p>
                      </div>
                      
                      <button
                        onClick={decryptPayload}
                        disabled={isDecrypting}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        {isDecrypting ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                        <span>{isDecrypting ? 'Decrypting...' : 'View Results'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Analysis Results */}
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <DocumentCheckIcon className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">AI Analysis Results</h3>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {analysisResult.analysis_result.overall_score}/100
                      </div>
                      <div className="text-gray-400 text-sm">Overall Score</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-400 mb-1">
                        {analysisResult.analysis_result.security_score}/100
                      </div>
                      <div className="text-gray-400 text-sm">Security Score</div>
                    </div>
                  </div>
                </div>

                {/* Issues Summary */}
                {analysisResult.analysis_result.issues.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-3">
                      Issues Found ({analysisResult.analysis_result.issues.length})
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.analysis_result.issues.slice(0, 3).map((issue, index) => (
                        <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                            <span className="text-red-400 font-medium capitalize">
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-red-100 text-sm">{issue.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.analysis_result.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">
                      AI Recommendations ({analysisResult.analysis_result.recommendations.length})
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.analysis_result.recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <CheckCircleIcon className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-blue-100 text-sm">{rec}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blockchain Verification */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <ShieldCheckIcon className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Verified by Agent</span>
                    </div>
                    <div className="text-gray-400 font-mono text-xs">
                      Signature: {analysisResult.agent_signature.slice(0, 10)}...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Session History */}
            {userSessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-purple-400" />
                  <span>Your Sessions</span>
                </h3>
                
                <div className="space-y-3">
                  {userSessions.slice(-5).map((session, index) => (
                    <div
                      key={session.session_id}
                      className="p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                      onClick={() => setCurrentSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-medium">
                            Session {session.session_id.slice(0, 8)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className={`px-2 py-1 rounded text-xs ${
                          session.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          session.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                          session.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {session.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            
            {/* Polling Status */}
            {lastPollTime && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Live Monitoring</div>
                    <div className="text-gray-400 text-xs">
                      Last update: {lastPollTime.toLocaleTimeString()}
                    </div>
                  </div>
                  <ArrowPathIcon className="h-4 w-4 text-green-400 animate-spin" />
                </div>
              </motion.div>
            )}

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6"
            >
              <h4 className="text-blue-400 font-semibold mb-3">How A2A Protocol Works</h4>
              <div className="space-y-3 text-sm text-blue-200">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>Connect your MetaMask wallet</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>Submit prompt + code for AI review</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>Agent processes with A2A protocol</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">4.</span>
                  <span>Results encrypted for your wallet only</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">5.</span>
                  <span>Sign to decrypt and view results</span>
                </div>
              </div>
            </motion.div>

            {/* ERC-8004 Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6"
            >
              <h4 className="text-purple-400 font-semibold mb-3">ERC-8004 Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-purple-200">
                  <CheckCircleIcon className="h-4 w-4 text-purple-400" />
                  <span>Trustless agent interactions</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-200">
                  <CheckCircleIcon className="h-4 w-4 text-purple-400" />
                  <span>Encrypted payload system</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-200">
                  <CheckCircleIcon className="h-4 w-4 text-purple-400" />
                  <span>Blockchain audit trail</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-200">
                  <CheckCircleIcon className="h-4 w-4 text-purple-400" />
                  <span>Session persistence</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-200">
                  <CheckCircleIcon className="h-4 w-4 text-purple-400" />
                  <span>Real-time DRPC monitoring</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
