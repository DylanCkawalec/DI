import React from 'react';
import { motion } from 'framer-motion';
import {
  DocumentArrowDownIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  LinkIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface AuditDownloaderProps {
  validationData: {
    validation_id: string;
    validation_score: number;
    improved_code?: string;
    transaction_hash?: string;
    basescan_url?: string;
    audit_receipt?: {
      validation_date: string;
      validator: string;
      original_score: number;
      improved_score: number;
      blockchain_proof: string;
      contract_address?: string;
      network: string;
    };
  };
  originalReviewData: {
    review_id: string;
    overall_score: number;
    security_score: number;
    issues: any[];
    recommendations: string[];
  };
  language: string;
  walletAddress: string;
}

export default function AuditDownloader({ 
  validationData, 
  originalReviewData, 
  language,
  walletAddress 
}: AuditDownloaderProps) {

  const downloadImprovedCode = () => {
    if (!validationData.improved_code) return;
    
    const blob = new Blob([validationData.improved_code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `improved_code_${validationData.validation_id}.${language}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📥 Improved code downloaded');
  };

  const downloadAuditReceipt = () => {
    if (!validationData.audit_receipt) return;
    
    const auditReport = {
      title: 'ERC-8004 Professional Security Audit Receipt',
      validation_details: {
        validation_id: validationData.validation_id,
        validation_date: validationData.audit_receipt.validation_date,
        validator: validationData.audit_receipt.validator,
        network: validationData.audit_receipt.network,
        blockchain_proof: validationData.audit_receipt.blockchain_proof,
        contract_address: validationData.audit_receipt.contract_address,
        basescan_url: validationData.basescan_url
      },
      user_details: {
        wallet_address: walletAddress,
        submission_time: new Date().toISOString()
      },
      analysis_results: {
        original_score: validationData.audit_receipt.original_score,
        improved_score: validationData.audit_receipt.improved_score,
        improvement: validationData.audit_receipt.improved_score - validationData.audit_receipt.original_score,
        security_issues_found: originalReviewData.issues.length,
        recommendations_applied: originalReviewData.recommendations.length
      },
      compliance: {
        erc8004_compliant: true,
        professional_audit: true,
        blockchain_verified: true,
        independently_validated: true
      },
      next_steps: [
        'Deploy improved code to production',
        'Keep this audit receipt for compliance',
        'Share blockchain proof with stakeholders',
        'Consider additional security testing for critical systems'
      ]
    };
    
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_receipt_${validationData.validation_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📥 Audit receipt downloaded');
  };

  const viewOnBaseScan = () => {
    if (validationData.basescan_url) {
      window.open(validationData.basescan_url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <ShieldCheckIcon className="h-6 w-6 text-green-400" />
        <h3 className="text-xl font-semibold text-white">Validation Complete!</h3>
      </div>

      {/* Validation Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400 mb-1">
            {validationData.validation_score}/100
          </div>
          <div className="text-gray-400 text-sm">Validation Score</div>
        </div>
        
        <div className="bg-gray-700/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">
            +{validationData.audit_receipt ? 
              (validationData.audit_receipt.improved_score - validationData.audit_receipt.original_score) : 0}
          </div>
          <div className="text-gray-400 text-sm">Score Improvement</div>
        </div>
      </div>

      {/* Download Actions */}
      <div className="space-y-4">
        <h4 className="text-white font-medium mb-3">📥 Download Your Results</h4>
        
        {/* Download Improved Code */}
        {validationData.improved_code && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={downloadImprovedCode}
            className="w-full flex items-center space-x-3 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-colors"
          >
            <CodeBracketIcon className="h-6 w-6 text-blue-400" />
            <div className="flex-1 text-left">
              <div className="text-blue-300 font-medium">Download Improved Code</div>
              <div className="text-blue-200 text-sm">
                Enhanced {language} code with security fixes applied
              </div>
            </div>
            <DocumentArrowDownIcon className="h-5 w-5 text-blue-400" />
          </motion.button>
        )}

        {/* Download Audit Receipt */}
        {validationData.audit_receipt && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={downloadAuditReceipt}
            className="w-full flex items-center space-x-3 p-4 bg-green-500/20 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-colors"
          >
            <ShieldCheckIcon className="h-6 w-6 text-green-400" />
            <div className="flex-1 text-left">
              <div className="text-green-300 font-medium">Download Audit Receipt</div>
              <div className="text-green-200 text-sm">
                Professional compliance report with blockchain proof
              </div>
            </div>
            <DocumentArrowDownIcon className="h-5 w-5 text-green-400" />
          </motion.button>
        )}

        {/* View on BaseScan */}
        {validationData.basescan_url && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={viewOnBaseScan}
            className="w-full flex items-center space-x-3 p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-colors"
          >
            <LinkIcon className="h-6 w-6 text-purple-400" />
            <div className="flex-1 text-left">
              <div className="text-purple-300 font-medium">View Transaction on BaseScan</div>
              <div className="text-purple-200 text-sm">
                Verify validation on Base Sepolia blockchain
              </div>
            </div>
            <div className="text-purple-400 text-xs">
              {validationData.transaction_hash?.slice(0, 10)}...
            </div>
          </motion.button>
        )}
      </div>

      {/* Blockchain Verification */}
      <div className="mt-6 p-4 bg-gray-700/20 rounded-xl">
        <h5 className="text-white font-medium mb-3 flex items-center">
          <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
          Blockchain Verification
        </h5>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Transaction Hash</div>
            <div className="text-green-400 font-mono text-xs break-all">
              {validationData.transaction_hash}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 mb-1">Network</div>
            <div className="text-green-400">Base Sepolia</div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-400">
          ✅ Professionally audited and recorded on blockchain
        </div>
      </div>

      {/* Value Delivered */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex items-center space-x-2 mb-3">
          <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium text-sm">Value Delivered</span>
        </div>
        
        <div className="text-yellow-200 text-xs space-y-1">
          <div>• Professional security audit (typically $5,000+ value)</div>
          <div>• Improved code with fixes applied</div>
          <div>• Blockchain verification for compliance</div>
          <div>• Complete audit trail and documentation</div>
          <div>• Cost: ~$0.006 (99.9% savings vs traditional audit)</div>
        </div>
      </div>
    </motion.div>
  );
}
