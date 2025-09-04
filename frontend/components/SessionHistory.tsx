import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface SessionHistoryProps {
  walletAddress: string;
}

interface SessionData {
  session_id: string;
  status: string;
  created_at: string;
  has_encrypted_payload: boolean;
  user_address: string;
  analysis_result?: any;
}

export default function SessionHistory({ walletAddress }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  useEffect(() => {
    if (walletAddress) {
      loadUserSessions();
    }
  }, [walletAddress]);

  const loadUserSessions = async () => {
    try {
      // Get all sessions from debug endpoint
      const response = await fetch('http://localhost:8080/api/debug/replies');
      if (response.ok) {
        const data = await response.json();
        
        // Filter sessions for current user
        const userSessions = Object.values(data.sessions).filter((session: any) => 
          session.session_info.user_address.toLowerCase() === walletAddress.toLowerCase()
        );
        
        setSessions(userSessions.map((session: any) => session.session_info));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const viewSessionDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/debug/session/${sessionId}`);
      if (response.ok) {
        const details = await response.json();
        setSessionDetails(details);
        setSelectedSession(sessionId);
      }
    } catch (error) {
      console.error('Failed to load session details:', error);
    }
  };

  const downloadSessionData = (session: SessionData) => {
    const sessionExport = {
      title: 'ERC-8004 A2A Session Export',
      session_info: {
        session_id: session.session_id,
        status: session.status,
        created_at: session.created_at,
        user_address: session.user_address
      },
      export_date: new Date().toISOString(),
      note: 'Complete session data from ERC-8004 A2A protocol'
    };

    const blob = new Blob([JSON.stringify(sessionExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session_${session.session_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'processing': return 'text-yellow-400 bg-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'processing': return ClockIcon;
      case 'failed': return ExclamationTriangleIcon;
      default: return InformationCircleIcon;
    }
  };

  if (!walletAddress) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 text-center">
        <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">Connect wallet to view your session history</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ClockIcon className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Session History</h3>
        </div>
        <button
          onClick={loadUserSessions}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No sessions found</p>
            <p className="text-gray-500 text-sm">Submit a code review to see your history</p>
          </div>
        ) : (
          sessions.slice(-10).reverse().map((session) => {
            const StatusIcon = getStatusIcon(session.status);
            
            return (
              <motion.div
                key={session.session_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-colors cursor-pointer"
                onClick={() => viewSessionDetails(session.session_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-5 w-5 ${getStatusColor(session.status).split(' ')[0]}`} />
                    <div>
                      <div className="text-white font-medium">
                        Session {session.session_id.slice(0, 8)}...
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(session.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs border ${getStatusColor(session.status)}`}>
                      {session.status}
                    </div>
                    
                    {session.has_encrypted_payload && (
                      <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded text-xs">
                        Results
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSessionData(session);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-400"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedSession && sessionDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-white">Session Details</h4>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 mb-1">Session ID</div>
                    <div className="text-white font-mono break-all">{sessionDetails.session_id}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Status</div>
                    <div className={`${getStatusColor(sessionDetails.status).split(' ')[0]} font-medium`}>
                      {sessionDetails.status}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 mb-1">Created</div>
                    <div className="text-gray-300">{new Date(sessionDetails.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Updated</div>
                    <div className="text-gray-300">{new Date(sessionDetails.updated_at).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">Transaction Hashes</div>
                  <div className="space-y-1">
                    {sessionDetails.transaction_hashes.map((hash: string, index: number) => (
                      <div key={index} className="text-blue-400 font-mono text-xs break-all">
                        {hash}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">Encrypted Payload</div>
                  <div className={`${sessionDetails.has_encrypted_payload ? 'text-green-400' : 'text-gray-400'}`}>
                    {sessionDetails.has_encrypted_payload ? '✅ Available' : '❌ Not available'}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
