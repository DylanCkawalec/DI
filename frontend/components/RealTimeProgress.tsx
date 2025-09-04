import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LinkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  aiAgent?: string;
  apiCall?: string;
  duration?: number;
  details?: string;
  transactionHash?: string;
  etherscanLink?: string;
}

interface RealTimeProgressProps {
  isActive: boolean;
  currentStep: string;
  onStepUpdate: (step: ProgressStep) => void;
  etherscanApiKey: string;
}

export default function RealTimeProgress({ 
  isActive, 
  currentStep, 
  onStepUpdate, 
  etherscanApiKey = 'EF32MAFD3I58N92X1DP2637731ZANQ2ADG' 
}: RealTimeProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'session_create',
      name: 'Creating A2A Session',
      status: 'pending',
      apiCall: 'POST /api/a2a/create-session',
      details: 'Initializing Agent-to-Agent protocol session'
    },
    {
      id: 'blockchain_tx',
      name: 'Blockchain Transaction',
      status: 'pending',
      apiCall: 'MetaMask sendTransaction',
      details: 'Recording code review on Base Sepolia blockchain'
    },
    {
      id: 'ai_analysis',
      name: 'AI Code Analysis',
      status: 'pending',
      aiAgent: 'Grok AI (Primary)',
      apiCall: 'Grok API via A2A Protocol',
      details: 'Professional security and vulnerability analysis'
    },
    {
      id: 'encryption',
      name: 'Result Encryption',
      status: 'pending',
      apiCall: 'A2A Oracle Service',
      details: 'Encrypting analysis results for user-only access'
    },
    {
      id: 'validation_tx',
      name: 'Validation Transaction',
      status: 'pending',
      apiCall: 'MetaMask sendTransaction',
      details: 'Recording validation request on blockchain'
    },
    {
      id: 'validator_ai',
      name: 'Independent AI Validation',
      status: 'pending',
      aiAgent: 'Claude AI (Validator)',
      apiCall: 'POST localhost:8081/validate',
      details: 'Independent verification by validator agent'
    },
    {
      id: 'audit_generation',
      name: 'Audit Receipt Generation',
      status: 'pending',
      apiCall: 'Local Processing',
      details: 'Creating professional compliance documentation'
    }
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isActive && !startTime) {
      setStartTime(new Date());
    }
  }, [isActive]);

  useEffect(() => {
    // Update step based on currentStep prop
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex >= 0) {
      setCurrentStepIndex(stepIndex);
      
      // Update step status
      setSteps(prevSteps => 
        prevSteps.map((step, index) => ({
          ...step,
          status: index < stepIndex ? 'completed' :
                  index === stepIndex ? 'processing' : 'pending'
        }))
      );
    }
  }, [currentStep]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'processing': return ArrowPathIcon;
      case 'failed': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'processing': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'failed': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-gray-400 border-gray-600/30 bg-gray-500/10';
    }
  };

  const lookupTransaction = async (txHash: string) => {
    if (!txHash || !txHash.startsWith('0x')) return;

    try {
      const response = await fetch(
        `https://api-sepolia.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${etherscanApiKey}`
      );
      const data = await response.json();
      
      if (data.result) {
        const etherscanLink = `https://sepolia.basescan.org/tx/${txHash}`;
        
        // Update step with transaction details
        const stepUpdate = {
          transactionHash: txHash,
          etherscanLink: etherscanLink,
          details: `Transaction confirmed on Base Sepolia`
        };
        
        onStepUpdate(stepUpdate as ProgressStep);
      }
    } catch (error) {
      console.error('Etherscan lookup failed:', error);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CpuChipIcon className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Real-Time A2A Progress</h3>
        </div>
        
        {startTime && (
          <div className="text-sm text-gray-400">
            Running for {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)}s
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const StepIcon = getStepIcon(step.status);
          const isActive = index === currentStepIndex;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-4 rounded-xl border transition-all
                ${getStepColor(step.status)}
                ${isActive ? 'ring-2 ring-blue-500/30' : ''}
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className="flex-shrink-0">
                  {step.status === 'processing' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <StepIcon className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <StepIcon className="h-6 w-6" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{step.name}</h4>
                    {step.status === 'processing' && (
                      <div className="text-xs text-blue-400 animate-pulse">
                        Processing...
                      </div>
                    )}
                  </div>

                  {/* AI Agent Info */}
                  {step.aiAgent && (
                    <div className="flex items-center space-x-2 mb-2">
                      <CpuChipIcon className="h-4 w-4 text-purple-400" />
                      <span className="text-purple-300 text-sm font-medium">
                        {step.aiAgent}
                      </span>
                    </div>
                  )}

                  {/* API Call Info */}
                  {step.apiCall && (
                    <div className="flex items-center space-x-2 mb-2">
                      <LinkIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-300 text-sm font-mono">
                        {step.apiCall}
                      </span>
                    </div>
                  )}

                  {/* Step Details */}
                  <p className="text-gray-300 text-sm">{step.details}</p>

                  {/* Transaction Hash & Etherscan Link */}
                  {step.transactionHash && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-2 bg-gray-700/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
                          <div className="text-green-400 font-mono text-xs break-all">
                            {step.transactionHash}
                          </div>
                        </div>
                        
                        {step.etherscanLink && (
                          <button
                            onClick={() => window.open(step.etherscanLink, '_blank')}
                            className="ml-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-500/30 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Duration */}
                  {step.duration && (
                    <div className="mt-2 text-xs text-gray-400">
                      Completed in {step.duration}ms
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-6 p-4 bg-gray-700/20 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Overall Progress</span>
          <span className="text-blue-400 font-mono">
            {steps.filter(s => s.status === 'completed').length}/{steps.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-600 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Current AI Agent Status */}
      {steps[currentStepIndex]?.aiAgent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-purple-400 rounded-full"
            />
            <div>
              <div className="text-purple-300 font-medium">
                🧠 {steps[currentStepIndex].aiAgent} Active
              </div>
              <div className="text-purple-200 text-sm">
                Processing your code with professional AI analysis...
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Blockchain Integration Info */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-center space-x-3">
          <LinkIcon className="h-4 w-4 text-blue-400" />
          <div>
            <div className="text-blue-300 font-medium">Base Sepolia Integration</div>
            <div className="text-blue-200 text-sm">
              Etherscan API connected • Real-time transaction verification
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
