import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface ReviewResultsProps {
  data: {
    review_id: string;
    overall_score: number;
    security_score: number;
    performance_score: number;
    maintainability_score: number;
    style_score: number;
    issues: Array<{
      type: string;
      message: string;
      line?: number;
      severity: string;
    }>;
    recommendations: string[];
    analysis_details: any;
  };
}

export default function ReviewResults({ data }: ReviewResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-400';
    if (score >= 60) return 'from-yellow-500 to-yellow-400';
    if (score >= 40) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return XCircleIcon;
      case 'high': return ExclamationTriangleIcon;
      case 'medium': return InformationCircleIcon;
      case 'low': return CheckCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const scoreCategories = [
    { icon: ShieldCheckIcon, label: 'Security', score: data.security_score, key: 'security' },
    { icon: BoltIcon, label: 'Performance', score: data.performance_score, key: 'performance' },
    { icon: WrenchScrewdriverIcon, label: 'Maintainability', score: data.maintainability_score, key: 'maintainability' },
    { icon: SparklesIcon, label: 'Style', score: data.style_score, key: 'style' }
  ];

  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const groupedIssues = data.issues.reduce((acc: any, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Review Results</h3>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          ID: {data.review_id}
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-medium text-white">Overall Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(data.overall_score)}`}>
            {data.overall_score}/100
          </span>
        </div>
        
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.overall_score}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full bg-gradient-to-r ${getScoreGradient(data.overall_score)} rounded-full`}
          />
        </div>
      </div>

      {/* Category Scores */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-white mb-4">Category Breakdown</h4>
        <div className="grid grid-cols-2 gap-4">
          {scoreCategories.map((category, index) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${getScoreBg(category.score)} ${getSeverityColor(
                category.score >= 80 ? 'low' : category.score >= 60 ? 'medium' : category.score >= 40 ? 'high' : 'critical'
              ).split(' ').slice(2).join(' ')}`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <category.icon className="h-5 w-5 text-white" />
                <span className="text-white font-medium">{category.label}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.score}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${getScoreGradient(category.score)} rounded-full`}
                    />
                  </div>
                </div>
                <span className={`ml-3 font-bold ${getScoreColor(category.score)}`}>
                  {category.score}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Issues Summary */}
      {data.issues.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-medium text-white mb-4">Issues Found ({data.issues.length})</h4>
          
          <div className="space-y-3">
            {severityOrder.map(severity => {
              const issues = groupedIssues[severity];
              if (!issues || issues.length === 0) return null;
              
              const IconComponent = getSeverityIcon(severity);
              
              return (
                <motion.div
                  key={severity}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`border rounded-lg p-3 ${getSeverityColor(severity)}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium capitalize">
                      {severity} ({issues.length})
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {issues.slice(0, 2).map((issue: any, index: number) => (
                      <div key={index} className="text-sm">
                        {issue.line && <span className="font-mono text-xs">Line {issue.line}: </span>}
                        <span className="text-white">{issue.message}</span>
                      </div>
                    ))}
                    
                    {issues.length > 2 && (
                      <div className="text-xs opacity-75">
                        +{issues.length - 2} more {severity} issues
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-white mb-4">AI Recommendations</h4>
          
          <div className="space-y-3">
            {data.recommendations.slice(0, 3).map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
              >
                <CheckCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-100 text-sm">{recommendation}</p>
              </motion.div>
            ))}
            
            {data.recommendations.length > 3 && (
              <div className="text-center py-2">
                <span className="text-gray-400 text-sm">
                  +{data.recommendations.length - 3} more recommendations
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Details */}
      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span>
                {data.analysis_details?.processing_time || '2.3s'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CpuChipIcon className="h-4 w-4" />
              <span>
                {data.analysis_details?.ai_model_used || 'GPT-4 + Static Analysis'}
              </span>
            </div>
          </div>
          <div className="text-xs">
            {new Date(data.analysis_details?.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
