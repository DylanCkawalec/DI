import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import TEEProtocolDemo from '../components/TEEProtocolDemo';
import AttestationVerificationProof from '../components/AttestationVerificationProof';
import ClientOnlyWrapper from '../components/ClientOnlyWrapper';

export default function TEEPage() {
  return (
    <>
      <Head>
        <title>TEE-Enhanced ERC-8004 Protocol | Cryptographically Secured AI Agents</title>
        <meta name="description" content="Experience the enhanced ERC-8004 protocol with TEE attestation, RA-TLS certificates, and progressive trust scoring." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link 
                href="/"
                className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Main App</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  TEE-Enhanced Protocol
                </h1>
                <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                  Cryptographically Secured
                </span>
              </div>
              
              <div className="w-32"> {/* Spacer for centered title */}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-8">
          <ClientOnlyWrapper>
            <div className="space-y-8">
              <TEEProtocolDemo />
              <AttestationVerificationProof />
            </div>
          </ClientOnlyWrapper>
        </main>

        {/* Footer */}
        <footer className="mt-16 py-8 bg-white/50 backdrop-blur-sm border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <ShieldCheckIcon className="h-4 w-4" />
                <span>Powered by TEE-Enhanced ERC-8004 Protocol</span>
              </div>
              <div className="text-xs text-gray-500">
                Deployed on Base Sepolia • Cryptographically Secured • Trustless Agents
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
