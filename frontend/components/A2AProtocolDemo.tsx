import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface A2AProtocolDemoProps {
  web3Provider?: any;
  isWalletConnected: boolean;
}

interface A2ASession {
  sessionId: string;
  userAddress: string;
  agentAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  result?: string;
  transactionHash?: string;
  createdAt: Date;
  costEth: number;
}

const A2AProtocolDemo: React.FC<A2AProtocolDemoProps> = ({ web3Provider, isWalletConnected }) => {
  const [sessions, setSessions] = useState<A2ASession[]>([]);
  const [currentSession, setCurrentSession] = useState<A2ASession | null>(null);
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  // Demo agent configuration
  const DEMO_AGENT_ADDRESS = '0xf9F9ec176636BA407844f431D95d3e2cb46C5B0C';
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com'
    : 'http://localhost:8080';

  const startA2ASession = async () => {
    if (!isWalletConnected || !web3Provider) {
      setStatus('❌ Please connect your wallet first');
      return;
    }

    if (!prompt.trim() || !code.trim()) {
      setStatus('❌ Please provide both prompt and code');
      return;
    }

    setIsProcessing(true);
    setStatus('🔄 Initiating A2A protocol session...');

    try {
      const signer = await web3Provider.getSigner();
      const userAddress = await signer.getAddress();

      // Create session with backend API
      const response = await fetch(`${API_BASE_URL}/api/a2a/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_address: userAddress,
          prompt: prompt,
          code: code,
          language: language,
          user_public_key: userAddress // Simplified for demo
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const sessionData = await response.json();
      
      const newSession: A2ASession = {
        sessionId: sessionData.session_id,
        userAddress: userAddress,
        agentAddress: DEMO_AGENT_ADDRESS,
        status: 'pending',
        prompt: prompt,
        createdAt: new Date(),
        costEth: 0.0005 // Estimated cost
      };

      setCurrentSession(newSession);
      setSessions(prev => [newSession, ...prev]);
      setStatus(`✅ A2A session created: ${sessionData.session_id}`);

      // Start polling for results
      pollSessionStatus(sessionData.session_id);

    } catch (error: any) {
      console.error('A2A session creation failed:', error);
      setStatus(`❌ Failed to create session: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const pollSessionStatus = async (sessionId: string) => {
    const maxPolls = 30; // 5 minutes maximum
    let polls = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/a2a/session/${sessionId}/status`);
        if (!response.ok) {
          throw new Error('Failed to fetch session status');
        }

        const statusData = await response.json();
        
        // Update session in state
        setSessions(prev => prev.map(session => 
          session.sessionId === sessionId 
            ? { 
                ...session, 
                status: statusData.status,
                result: statusData.result,
                transactionHash: statusData.transaction_hash
              }
            : session
        ));

        if (currentSession?.sessionId === sessionId) {
          setCurrentSession(prev => prev ? {
            ...prev,
            status: statusData.status,
            result: statusData.result,
            transactionHash: statusData.transaction_hash
          } : null);
        }

        if (statusData.status === 'completed') {
          setStatus(`✅ Session completed with blockchain verification`);
          return; // Stop polling
        } else if (statusData.status === 'failed') {
          setStatus(`❌ Session failed: ${statusData.error || 'Unknown error'}`);
          return; // Stop polling
        } else if (statusData.status === 'processing') {
          setStatus(`🔄 AI agents are processing your request...`);
        }

        // Continue polling if not finished and within limits
        polls++;
        if (polls < maxPolls) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setStatus('⏱️ Session timeout - please check status manually');
        }

      } catch (error) {
        console.error('Polling failed:', error);
        setStatus(`⚠️ Failed to check session status: ${error}`);
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 2000);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="space-y-6">
      {/* A2A Session Creation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Start A2A Protocol Session
        </h3>
        
        <div className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code Review Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want the AI agents to analyze..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code to Analyze
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="solidity">Solidity</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={8}
            />
          </div>

          {/* Cost Estimate */}
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="text-sm text-blue-800">
              <strong>Estimated Cost:</strong> ~0.0005 ETH (~$1.20)
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Includes server agent analysis + validator agent verification
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-700">{status}</div>
            </div>
          )}

          {/* Start Session Button */}
          <button
            onClick={startA2ASession}
            disabled={!isWalletConnected || isProcessing}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              !isWalletConnected || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {!isWalletConnected
              ? 'Connect Wallet to Start Session'
              : isProcessing
              ? 'Creating Session...'
              : 'Start A2A Analysis Session'
            }
          </button>
        </div>
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Current Session Status
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Session ID:</span>
              <span className="font-mono text-sm">{currentSession.sessionId}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(currentSession.status)}`}>
                {getStatusIcon(currentSession.status)} {currentSession.status.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Agent Address:</span>
              <span className="font-mono text-sm">{currentSession.agentAddress.slice(0, 10)}...</span>
            </div>

            {currentSession.transactionHash && (
              <div className="mt-3 p-2 bg-green-50 rounded">
                <div className="text-sm text-green-800">
                  <strong>Blockchain Verification:</strong>
                </div>
                <a
                  href={`https://sepolia.basescan.org/tx/${currentSession.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline hover:no-underline"
                >
                  View Transaction on BaseScan →
                </a>
              </div>
            )}

            {currentSession.result && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-700 mb-2">Analysis Result:</div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                  {currentSession.result}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Session History
          </h3>
          
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.sessionId} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm text-gray-600">
                    {session.sessionId.slice(0, 16)}...
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                    {getStatusIcon(session.status)} {session.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {session.createdAt.toLocaleString()} • Cost: {session.costEth} ETH
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {session.prompt.slice(0, 100)}{session.prompt.length > 100 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default A2AProtocolDemo;
