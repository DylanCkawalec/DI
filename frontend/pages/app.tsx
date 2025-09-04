import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  CpuChipIcon,
  SparklesIcon,
  ShieldCheckIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import A2ACodeReviewApp from '../components/A2ACodeReviewApp';

export default function AppPage() {
  return (
    <>
      <Head>
        <title>ERC-8004 A2A Code Review | Production Application</title>
        <meta name="description" content="Production-ready AI code review using ERC-8004 Agent-to-Agent protocol" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Title */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl font-bold text-white mb-6">
                Professional
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                  {' '}AI Code Review
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Experience production-grade code analysis with AI agents working trustlessly 
                on the blockchain. Connect your MetaMask wallet and get professional security 
                audits powered by the ERC-8004 Agent-to-Agent protocol.
              </p>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex justify-center">
                <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
                  
                  <div className="flex items-center space-x-3 px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-full">
                    <CpuChipIcon className="h-5 w-5 text-blue-400" />
                    <span className="text-blue-200 font-medium">Multi-AI Analysis</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full">
                    <ShieldCheckIcon className="h-5 w-5 text-purple-400" />
                    <span className="text-purple-200 font-medium">Encrypted Results</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full">
                    <LinkIcon className="h-5 w-5 text-green-400" />
                    <span className="text-green-200 font-medium">Blockchain Verified</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 px-6 py-3 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                    <SparklesIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-yellow-200 font-medium">Real-time Updates</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Application */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <A2ACodeReviewApp />
        </motion.div>

        {/* Footer */}
        <footer className="relative z-10 mt-16 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <motion.div 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-800/50 border border-gray-700/50 rounded-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300 text-sm">
                  Powered by ERC-8004 Trustless Agents Standard
                </span>
              </motion.div>
              
              <p className="text-gray-500 text-xs mt-4">
                Built with ❤️ for the decentralized AI economy
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
