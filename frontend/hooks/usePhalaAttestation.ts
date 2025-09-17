import { useState, useEffect, useMemo } from 'react';

// Phala dstack SDK integration following validation.txt spec
interface DstackClient {
  info(): Promise<any>;
  getQuote(reportData: string): Promise<any>;
  getKey(path: string, keyType: string): Promise<any>;
  getTlsKey(options: {
    subject: string;
    altNames: string[];
    usageRaTls: boolean;
  }): Promise<any>;
}

interface TEEInfo {
  version?: string;
  mrtd?: string;
  rtmr0?: string;
  rtmr1?: string;
  rtmr2?: string;
  rtmr3?: string;
}

interface PhalaAttestationResult {
  success: boolean;
  checksum?: string;
  quote?: any;
  quote_collateral?: any;
  uploaded_at?: string;
  error?: string;
}

interface AttestationDetails {
  mrtd?: string;
  rtmr0?: string;
  rtmr1?: string;
  rtmr2?: string;
  rtmr3?: string;
  report_data?: string;
  timestamp?: number;
}

export function usePhalaAttestation() {
  const [dstackClient, setDstackClient] = useState<DstackClient | null>(null);
  const [teeInfo, setTeeInfo] = useState<TEEInfo | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize Phala dstack client
  useEffect(() => {
    initializeClient();
  }, []);

  const initializeClient = async () => {
    try {
      // Dynamic import of Phala dstack SDK
      const { DstackClient } = await import('@phala/dstack-sdk');
      
      // Create client that auto-connects to /var/run/dstack.sock
      const client = new DstackClient();
      
      // Test connection by getting TEE info
      const info = await client.info();
      
      if (info) {
        setDstackClient(client);
        setTeeInfo(info as TEEInfo);
        setIsAvailable(true);
        console.log('✅ Phala dstack client initialized successfully');
        console.log('✅ TEE Info:', info);
      } else {
        throw new Error('No TEE info available');
      }
    } catch (error: any) {
      console.warn('⚠️ Phala dstack client not available:', error.message);
      setError(error.message);
      setIsAvailable(false);
      // Continue in simulation mode
    }
  };

  // Generate TEE quote following validation.txt spec
  const generateTEEQuote = async (
    domain: string, 
    address: string,
    commit?: string
  ): Promise<{ quote: any; reportData: string; measurementHash: string } | null> => {
    if (!isAvailable || !dstackClient) {
      console.warn('TEE not available, generating mock quote');
      return generateMockQuote(domain, address, commit);
    }

    setLoading(true);
    try {
      // 1. Create report data following validation.txt format
      const reportDataContent = {
        v: 1,
        domain,
        commit: commit || 'erc8004-tee-agent-v1.0.0',
        model: `sha256:${await crypto.subtle.digest('SHA-256', 
          new TextEncoder().encode('erc8004-agent-model')
        ).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''))}`,
        nonce: crypto.randomUUID(),
        ts: Math.floor(Date.now() / 1000)
      };

      const reportDataJson = JSON.stringify(reportDataContent, Object.keys(reportDataContent).sort());
      console.log('📝 Report data prepared:', reportDataJson);

      // 2. Get TEE quote with bound report data
      const quote = await dstackClient.getQuote(reportDataJson);
      console.log('✅ TEE quote generated successfully');

      // 3. Calculate measurement hash from TEE info
      const measurementComponents = [
        teeInfo?.mrtd || '',
        teeInfo?.rtmr0 || '',
        teeInfo?.rtmr1 || '',
        teeInfo?.rtmr2 || '',
        teeInfo?.rtmr3 || ''
      ];
      
      const measurementHash = await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(measurementComponents.join(''))
      ).then(h => '0x' + Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));

      setLoading(false);
      return {
        quote,
        reportData: reportDataJson,
        measurementHash
      };
      
    } catch (error: any) {
      console.error('❌ TEE quote generation failed:', error);
      setError(error.message);
      setLoading(false);
      return generateMockQuote(domain, address, commit);
    }
  };

  // Generate RA-TLS certificate following validation.txt spec
  const generateRATLSCertificate = async (
    domain: string
  ): Promise<{ cert: any; fingerprint: string } | null> => {
    if (!isAvailable || !dstackClient) {
      console.warn('TEE not available, cannot generate RA-TLS certificate');
      return null;
    }

    try {
      // Generate RA-TLS server cert for API (embeds TDX quote in X.509 ext)
      const tls = await dstackClient.getTlsKey({
        subject: domain,
        altNames: [domain],
        usageRaTls: true
      });

      // Calculate certificate fingerprint
      const certData = JSON.stringify(tls);
      const fingerprint = await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(certData)
      ).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));

      console.log(`✅ RA-TLS certificate generated for domain: ${domain}`);
      
      return {
        cert: tls,
        fingerprint: `0x${fingerprint}`
      };
      
    } catch (error: any) {
      console.error('❌ RA-TLS certificate generation failed:', error);
      return null;
    }
  };

  // Generate deterministic TEE key following validation.txt spec
  const generateTEEKey = async (keyPath: string = 'erc8004/agent-wallet'): Promise<any> => {
    if (!isAvailable || !dstackClient) {
      console.warn('TEE not available, cannot generate TEE key');
      return null;
    }

    try {
      // Generate deterministic EVM key for the agent (lives inside TEE)
      const key = await dstackClient.getKey(keyPath, 'ethereum');
      console.log('🔑 TEE-derived agent key generated');
      return key;
    } catch (error: any) {
      console.error('❌ TEE key generation failed:', error);
      return null;
    }
  };

  // Mock quote generation for when TEE is not available
  const generateMockQuote = async (
    domain: string,
    address: string,
    commit?: string
  ): Promise<{ quote: any; reportData: string; measurementHash: string }> => {
    console.log('🔧 Generating mock TEE quote for demo...');
    
    const reportDataContent = {
      v: 1,
      domain,
      commit: commit || 'mock-erc8004-agent-v1.0.0',
      model: 'sha256:mock-model-hash',
      nonce: crypto.randomUUID(),
      ts: Math.floor(Date.now() / 1000)
    };

    const reportDataJson = JSON.stringify(reportDataContent, Object.keys(reportDataContent).sort());
    
    // Generate mock quote (256 bytes)
    const mockQuote = Array.from({length: 256}, () => Math.floor(Math.random() * 256));
    
    // Mock measurement hash
    const measurementHash = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode('mock-tee-measurement-v1.0.0')
    ).then(h => '0x' + Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));

    return {
      quote: new Uint8Array(mockQuote),
      reportData: reportDataJson,
      measurementHash
    };
  };

  // Verify attestation via Phala API
  const verifyAttestation = async (quoteData: Uint8Array): Promise<PhalaAttestationResult> => {
    try {
      const response = await fetch('/api/phala/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_hex: Array.from(quoteData).map(b => b.toString(16).padStart(2, '0')).join('')
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error: any) {
      console.error('Attestation verification failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Get attestation details from Phala API
  const getAttestationDetails = async (checksum: string): Promise<AttestationDetails | null> => {
    try {
      const response = await fetch(`/api/phala/details/${checksum}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get attestation details:', error);
      return null;
    }
  };

  return {
    // State
    isAvailable,
    teeInfo,
    loading,
    error,
    
    // Actions
    generateTEEQuote,
    generateRATLSCertificate,
    generateTEEKey,
    verifyAttestation,
    getAttestationDetails,
    
    // Utils
    generateMockQuote
  };
}

// Extend Window interface for crypto
declare global {
  interface Window {
    ethereum?: any;
  }
}
