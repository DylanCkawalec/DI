import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BeakerIcon,
  DocumentCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface ValidationPanelProps {
  data: {
    validation_id: string;
    validation_score: number;
    accuracy_score: number;
    completeness_score: number;
    methodology_score: number;
    discrepancies: Array<{
      type: string;
      category?: string;
      original_score?: number;
      validator_score?: number;
      difference?: number;
      severity: string;
    }>;
    recommendation: string;
  };
}

export default function ValidationPanel({ data }: ValidationPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-400';
    if (score >= 80) return 'from-blue-500 to-blue-400';
    if (score >= 70) return 'from-yellow-500 to-yellow-400';
    if (score >= 60) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-400';
  };

  const getRecommendationStyle = (recommendation: string) => {
    if (recommendation.includes('APPROVED')) {
      return 'bg-green-500/20 border-green-500/30 text-green-400';
    } else if (recommendation.includes('CONDITIONAL')) {
      return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
    } else if (recommendation.includes('REJECTED')) {
      return 'bg-red-500/20 border-red-500/30 text-red-400';
    }
    return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes('APPROVED')) {
      return CheckCircleIcon;
    } else if (recommendation.includes('CONDITIONAL')) {
      return ExclamationTriangleIcon;
    } else if (recommendation.includes('REJECTED')) {
      return XCircleIcon;
    }
    return DocumentCheckIcon;
  };

  const validationMetrics = [
    { icon: CheckBadgeIcon, label: 'Accuracy', score: data.accuracy_score, key: 'accuracy' },
    { icon: DocumentCheckIcon, label: 'Completeness', score: data.completeness_score, key: 'completeness' },
    { icon: BeakerIcon, label: 'Methodology', score: data.methodology_score, key: 'methodology' }
  ];

  const RecommendationIcon = getRecommendationIcon(data.recommendation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Validation Results</h3>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          ID: {data.validation_id}
        </div>
      </div>

      {/* Overall Validation Score */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-medium text-white">Validation Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(data.validation_score)}`}>
            {data.validation_score}/100
          </span>
        </div>
        
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.validation_score}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full bg-gradient-to-r ${getScoreGradient(data.validation_score)} rounded-full`}
          />
        </div>
        
        <div className="mt-2 text-sm text-gray-400">
          Independent validation by AI Validator Agent
        </div>
      </div>

      {/* Validation Metrics */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-white mb-4">Validation Breakdown</h4>
        <div className="space-y-4">
          {validationMetrics.map((metric, index) => (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 bg-gray-700/30 rounded-xl"
            >
              <metric.icon className="h-5 w-5 text-purple-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{metric.label}</span>
                  <span className={`font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score}/100
                  </span>
                </div>
                <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.score}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${getScoreGradient(metric.score)} rounded-full`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Discrepancies */}
      {data.discrepancies.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            Discrepancies Found ({data.discrepancies.length})
          </h4>
          
          <div className="space-y-3">
            {data.discrepancies.map((discrepancy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-yellow-400 font-medium capitalize">
                        {discrepancy.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        discrepancy.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        discrepancy.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {discrepancy.severity}
                      </span>
                    </div>
                    
                    {discrepancy.category && discrepancy.original_score && discrepancy.validator_score && (
                      <div className="text-sm text-gray-300">
                        <span className="capitalize">{discrepancy.category}</span>: 
                        Original {discrepancy.original_score} vs Validator {discrepancy.validator_score} 
                        <span className="text-yellow-400">
                          (±{discrepancy.difference} points)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-white mb-4">Validator Recommendation</h4>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`p-4 rounded-xl border ${getRecommendationStyle(data.recommendation)}`}
        >
          <div className="flex items-start space-x-3">
            <RecommendationIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-2">
                {data.recommendation.split(':')[0]}
              </div>
              <p className="text-sm opacity-90">
                {data.recommendation.includes(':') 
                  ? data.recommendation.split(':').slice(1).join(':').trim()
                  : data.recommendation
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Validation Process */}
      <div className="border-t border-gray-700 pt-4">
        <h5 className="text-white font-medium mb-3">Validation Process</h5>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-3 text-gray-300">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span>Independent code analysis performed</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span>Review methodology verified</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span>Results compared for accuracy</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span>Validation score calculated</span>
          </div>
        </div>
      </div>

      {/* Validation Details */}
      <div className="pt-4 border-t border-gray-700 mt-4">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4" />
              <span>Validator Agent Bob</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span>2.1s validation time</span>
            </div>
          </div>
          <div className="text-xs">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
