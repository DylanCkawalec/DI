import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  KeyIcon,
  GlobeAltIcon,
  CpuChipIcon,
  LockClosedIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function PhalaKMSBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-6 mb-8"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-xl">
          <ShieldCheckIcon className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Phala Cloud Decentralized KMS</h3>
          <p className="text-purple-200 text-sm">Trusted Execution Environment for AI Agents</p>
        </div>
      </div>

      {/* TEE Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-start space-x-3">
          <KeyIcon className="h-5 w-5 text-yellow-400 mt-1" />
          <div>
            <h4 className="text-white font-medium mb-1">Key Management</h4>
            <p className="text-gray-300 text-sm">
              Private keys secured in TEE hardware enclaves
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <CpuChipIcon className="h-5 w-5 text-green-400 mt-1" />
          <div>
            <h4 className="text-white font-medium mb-1">AI Processing</h4>
            <p className="text-gray-300 text-sm">
              Code analysis in verifiable secure environments
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <CheckBadgeIcon className="h-5 w-5 text-blue-400 mt-1" />
          <div>
            <h4 className="text-white font-medium mb-1">Remote Attestation</h4>
            <p className="text-gray-300 text-sm">
              Cryptographic proof of execution integrity
            </p>
          </div>
        </div>
      </div>

      {/* TEE Security Benefits */}
      <div className="space-y-3">
        <h4 className="text-purple-300 font-medium">🛡️ Decentralized Security Guarantees:</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <LockClosedIcon className="h-4 w-4 text-green-400" />
            <span className="text-green-200">Hardware-level encryption</span>
          </div>
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="h-4 w-4 text-blue-400" />
            <span className="text-blue-200">Distributed execution</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckBadgeIcon className="h-4 w-4 text-purple-400" />
            <span className="text-purple-200">Verifiable computations</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-200">Zero-trust architecture</span>
          </div>
        </div>
      </div>

      {/* Phala Integration Status */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-purple-300 font-medium">Phala Cloud TEE Status</h4>
            <p className="text-purple-200 text-sm">
              ERC-8004 A2A agents running in secure Phala enclaves
            </p>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold">ACTIVE</div>
            <div className="text-green-300 text-xs">Remote Attestation ✓</div>
          </div>
        </div>
      </div>

      {/* API Key Integration */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-center space-x-2">
          <KeyIcon className="h-4 w-4 text-blue-400" />
          <span className="text-blue-300 text-sm">
            Phala API: phak_AITHmEg1_xqgbIHi-qqxxGBkyEBWfzfauJJOnnX_MRY (Integrated)
          </span>
        </div>
      </div>
    </motion.div>
  );
}
