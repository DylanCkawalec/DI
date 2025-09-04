import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CpuChipIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AIStatusBannerProps {
  currentAI: string;
  isProcessing: boolean;
  step: number;
  estimatedTime?: string;
}

export default function AIStatusBanner({ 
  currentAI, 
  isProcessing, 
  step,
  estimatedTime 
}: AIStatusBannerProps) {
  
  const getAIInfo = (aiName: string) => {
    if (aiName.includes('Grok')) {
      return {
        icon: SparklesIcon,
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/30',
        purpose: 'Primary Analysis Engine',
        description: 'Fast, cost-effective professional code review'
      };
    } else if (aiName.includes('Claude')) {
      return {
        icon: ShieldCheckIcon,
        color: 'text-purple-400', 
        bg: 'bg-purple-500/10 border-purple-500/30',
        purpose: 'Independent Validator',
        description: 'Thorough validation and methodology verification'
      };
    } else if (aiName.includes('OpenAI')) {
      return {
        icon: CpuChipIcon,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30',
        purpose: 'Backup Analysis',
        description: 'Reliable fallback analysis and verification'
      };
    }
    
    return {
      icon: CpuChipIcon,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10 border-gray-500/30',
      purpose: 'Local Analysis',
      description: 'Offline analysis when AI unavailable'
    };
  };

  if (!isProcessing || !currentAI) {
    return null;
  }

  const aiInfo = getAIInfo(currentAI);
  const AIIcon = aiInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 ${aiInfo.bg} border rounded-xl p-4 shadow-xl backdrop-blur-sm`}
      >
        <div className="flex items-center space-x-4">
          {/* AI Icon with Animation */}
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`p-3 rounded-full ${aiInfo.bg}`}
            >
              <AIIcon className={`h-6 w-6 ${aiInfo.color}`} />
            </motion.div>
            
            {/* Processing indicator */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1 w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          </div>

          {/* AI Information */}
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h4 className={`font-bold ${aiInfo.color}`}>
                {currentAI}
              </h4>
              
              {estimatedTime && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm">{estimatedTime}</span>
                </div>
              )}
            </div>
            
            <div className="text-gray-300 text-sm font-medium mb-1">
              {aiInfo.purpose}
            </div>
            
            <div className="text-gray-400 text-xs">
              {aiInfo.description}
            </div>
          </div>

          {/* Step Indicator */}
          <div className="text-right">
            <div className={`text-lg font-bold ${aiInfo.color}`}>
              {step}/5
            </div>
            <div className="text-gray-400 text-xs">
              Steps
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <motion.div
              className={`h-1.5 rounded-full bg-gradient-to-r ${
                aiInfo.color.includes('green') ? 'from-green-500 to-green-400' :
                aiInfo.color.includes('purple') ? 'from-purple-500 to-purple-400' :
                aiInfo.color.includes('blue') ? 'from-blue-500 to-blue-400' :
                'from-gray-500 to-gray-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Live Status Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-center"
        >
          <div className={`text-sm ${aiInfo.color} flex items-center justify-center space-x-2`}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-current"
            />
            <span>
              {step === 2 ? 'Analyzing code with professional AI...' :
               step === 4 ? 'Independent validation in progress...' :
               'Processing...'}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
