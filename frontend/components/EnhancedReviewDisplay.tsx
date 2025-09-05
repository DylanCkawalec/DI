import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CodeBracketIcon,
  CpuChipIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface EnhancedReviewDisplayProps {
  data: {
    review_id: string;
    overall_score: number;
    security_score: number;
    performance_score: number;
    vulnerability_report?: {
      total_vulnerabilities: number;
      severity_breakdown: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
      risk_score: number;
      vulnerabilities: Array<{
        id: string;
        type: string;
        severity: string;
        description: string;
        location: string;
        remediation: string;
        source_phase: string;
      }>;
    };
    compliance_assessment?: {
      frameworks: any;
      overall_compliance_score: number;
      recommendations: string[];
    };
    cost_breakdown?: {
      total_cost_usd: number;
      total_tokens: number;
      processing_time: number;
      phases_completed: number;
    };
    expert_analysis?: any;
    improved_code?: string;
    recommendations: string[];
  };
}

export default function EnhancedReviewDisplay({ data }: EnhancedReviewDisplayProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Score Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Expert AI Analysis</h3>
          </div>
          <div className="text-sm text-gray-400">
            ID: {data.review_id}
          </div>
        </div>

        {/* Score Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(data.overall_score)}`}>
              {data.overall_score}
            </div>
            <div className="text-sm text-gray-400 mt-1">Overall</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(data.security_score)}`}>
              {data.security_score}
            </div>
            <div className="text-sm text-gray-400 mt-1">Security</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(data.performance_score)}`}>
              {data.performance_score}
            </div>
            <div className="text-sm text-gray-400 mt-1">Performance</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {data.expert_analysis?.phase_results ? Object.keys(data.expert_analysis.phase_results).length : 6}
            </div>
            <div className="text-sm text-gray-400 mt-1">AI Phases</div>
          </div>
        </div>

        {/* Cost & Performance Metrics */}
        {data.cost_breakdown && (
          <div className="bg-gray-700/20 rounded-lg p-4 mb-6">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <ChartBarIcon className="h-5 w-5 text-green-400 mr-2" />
              Expert Analysis Metrics
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Cost</div>
                <div className="text-green-400 font-mono">${data.cost_breakdown.total_cost_usd.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-gray-400">Tokens</div>
                <div className="text-blue-400 font-mono">{data.cost_breakdown.total_tokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Processing</div>
                <div className="text-purple-400 font-mono">{data.cost_breakdown.processing_time.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-gray-400">AI Phases</div>
                <div className="text-yellow-400 font-mono">{data.cost_breakdown.phases_completed}/6</div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Vulnerability Report */}
      {data.vulnerability_report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-900/10 border border-red-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Security Vulnerability Report</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{data.vulnerability_report.severity_breakdown.critical}</div>
              <div className="text-sm text-red-300">Critical</div>
            </div>
            <div className="bg-orange-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">{data.vulnerability_report.severity_breakdown.high}</div>
              <div className="text-sm text-orange-300">High</div>
            </div>
            <div className="bg-yellow-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{data.vulnerability_report.severity_breakdown.medium}</div>
              <div className="text-sm text-yellow-300">Medium</div>
            </div>
            <div className="bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{data.vulnerability_report.severity_breakdown.low}</div>
              <div className="text-sm text-blue-300">Low</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Risk Score</span>
              <span className={`font-bold ${getScoreColor(100 - data.vulnerability_report.risk_score)}`}>
                {data.vulnerability_report.risk_score}/100
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  data.vulnerability_report.risk_score > 70 ? 'bg-red-500' :
                  data.vulnerability_report.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${data.vulnerability_report.risk_score}%` }}
              />
            </div>
          </div>

          {/* Top vulnerabilities */}
          {data.vulnerability_report.vulnerabilities.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-3">Top Security Issues</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.vulnerability_report.vulnerabilities.slice(0, 5).map((vuln, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{vuln.source_phase}</span>
                    </div>
                    <div className="text-white text-sm font-medium mb-1">{vuln.type}</div>
                    <div className="text-gray-300 text-sm mb-2">{vuln.description}</div>
                    <div className="text-xs text-gray-400">Location: {vuln.location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Compliance Assessment */}
      {data.compliance_assessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-purple-900/10 border border-purple-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <DocumentTextIcon className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Compliance Assessment</h3>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Overall Compliance Score</span>
              <span className={`font-bold ${getScoreColor(data.compliance_assessment.overall_compliance_score)}`}>
                {data.compliance_assessment.overall_compliance_score}/100
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  data.compliance_assessment.overall_compliance_score >= 80 ? 'bg-green-500' :
                  data.compliance_assessment.overall_compliance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${data.compliance_assessment.overall_compliance_score}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3">
            {Object.entries(data.compliance_assessment.frameworks).map(([framework, details]: [string, any]) => (
              <div key={framework} className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{framework.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${getScoreColor(details.score)}`}>
                      {details.score}/100
                    </span>
                    {details.compliant ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Model Information */}
      {data.expert_analysis?.phase_results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-900/10 border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <CpuChipIcon className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">AI Analysis Phases</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(data.expert_analysis.phase_results).map(([phase, result]: [string, any], index) => (
              <div key={phase} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">
                    {phase.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${result.error ? 'text-red-400' : 'text-green-400'}`}>
                      {result.error ? 'Failed' : 'Success'}
                    </span>
                    {result.confidence_score && (
                      <span className="text-xs text-gray-400">
                        {result.confidence_score}% confidence
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Model: {result.model_used || 'N/A'}</span>
                  <span>
                    {result.processing_time ? `${result.processing_time.toFixed(1)}s` : ''} 
                    {result.token_usage ? ` • ${result.token_usage} tokens` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Analysis Summary */}
          {data.expert_analysis.comprehensive_summary && (
            <div className="mt-4 bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Analysis Summary</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Critical Issues</div>
                  <div className="text-red-400 font-bold">
                    {data.expert_analysis.comprehensive_summary.critical_issue_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">High Issues</div>
                  <div className="text-orange-400 font-bold">
                    {data.expert_analysis.comprehensive_summary.high_issue_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Analysis Quality</div>
                  <div className="text-green-400 font-bold capitalize">
                    {data.expert_analysis.comprehensive_summary.analysis_quality || 'Expert'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Deployment</div>
                  <div className={`font-bold capitalize ${
                    data.expert_analysis.comprehensive_summary.deployment_readiness === 'ready_with_improvements' 
                      ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {data.expert_analysis.comprehensive_summary.deployment_readiness?.replace('_', ' ') || 'Needs Review'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Enhanced Recommendations */}
      {data.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-green-900/10 border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <CodeBracketIcon className="h-6 w-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Expert Recommendations</h3>
          </div>

          <div className="space-y-3">
            {data.recommendations.slice(0, 10).map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-400 text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Improved Code Preview */}
      {data.improved_code && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">AI-Generated Improved Code</h3>
            </div>
            <div className="text-sm text-gray-400">
              {data.improved_code.length.toLocaleString()} characters
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {data.improved_code.substring(0, 1000)}
              {data.improved_code.length > 1000 && (
                <span className="text-gray-500">
                  \n\n... ({(data.improved_code.length - 1000).toLocaleString()} more characters)
                </span>
              )}
            </pre>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => navigator.clipboard.writeText(data.improved_code || '')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
            >
              Copy Improved Code
            </button>
            <button
              onClick={() => {
                const blob = new Blob([data.improved_code || ''], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `improved_${data.review_id}.py`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            >
              Download
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
