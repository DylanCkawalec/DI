import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';

// TEE-Enhanced Contract ABIs
const IDENTITY_REGISTRY_ABI = [
  'function newAgent(string domain, address agentAddress) external payable returns (uint256)',
  'function newAgentWithTEE(string domain, address agentAddress, bytes32 measurementHash, bytes attestationProof) external payable returns (uint256)',
  'function verifyDomain(uint256 agentId, bytes32 rootPubKeyHash, bytes certificateProof) external returns (bool)',
  'function getAgent(uint256 agentId) external view returns (tuple(uint256 agentId, string agentDomain, address agentAddress, bytes32 teeMeasurementHash, bool domainVerified, bytes32 rootPubKeyHash))',
  'function hasTEEAttestation(uint256 agentId) external view returns (bool)',
  'function isDomainVerified(uint256 agentId) external view returns (bool)',
  'function getAgentsByMeasurement(bytes32 measurementHash) external view returns (uint256[])',
  'function REGISTRATION_FEE() external view returns (uint256)',
  'event AgentRegistered(uint256 indexed agentId, string agentDomain, address agentAddress)',
  'event TEEAttestationVerified(uint256 indexed agentId, bytes32 indexed measurementHash)',
  'event DomainVerified(uint256 indexed agentId, bytes32 indexed rootPubKeyHash)'
];

const TEE_VERIFIER_ABI = [
  'function verifyTEEQuote(bytes quoteData, bytes32 expectedReportData, uint256 maxAge) external returns (bool verified, bytes32 measurementHash, bytes32 quoteHash)',
  'function verifyRATLSCertificate(bytes certificateData, string domain) external returns (bool verified, bytes32 rootCAHash)',
  'function isTrustedMeasurement(bytes32 measurementHash) external view returns (bool)',
  'function isTrustedRootCA(bytes32 rootCAHash) external view returns (bool)',
  'function getTrustedMeasurements() external view returns (tuple(bytes32 measurementHash, string description, uint256 addedAt, bool active)[])',
  'event TrustedMeasurementAdded(bytes32 indexed measurementHash, string description)',
  'event AttestationVerified(bytes32 indexed quoteHash, bytes32 measurementHash, bool valid)'
];

const REPUTATION_REGISTRY_ABI = [
  'function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external',
  'function acceptTEEFeedback(uint256 agentClientId, uint256 agentServerId, bool requireTEE) external',
  'function calculateFeedbackWeight(uint256 agentClientId, uint256 agentServerId) external view returns (uint256 weight, bool teeVerified)',
  'function requiresTEEVerification(bytes32 feedbackAuthId) external view returns (bool)',
  'function isFeedbackAuthorized(uint256 agentClientId, uint256 agentServerId) external view returns (bool isAuthorized, bytes32 feedbackAuthId)',
  'event AuthFeedback(uint256 indexed agentClientId, uint256 indexed agentServerId, bytes32 indexed feedbackAuthId)',
  'event TEEFeedbackAuthorized(uint256 indexed agentClientId, uint256 indexed agentServerId, bytes32 indexed feedbackAuthId, bytes32 measurementHash)'
];

const VALIDATION_REGISTRY_ABI = [
  'function validationRequest(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash) external',
  'function validationResponse(bytes32 dataHash, uint8 response) external',
  'function teeValidationRequest(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash, bytes32 measurementHash, bytes attestationProof) external',
  'function teeValidationResponse(bytes32 dataHash, uint8 response, bool attestationValid) external',
  'function getValidationResponse(bytes32 dataHash) external view returns (bool hasResponse, uint8 response)',
  'function isTEEValidationPending(bytes32 dataHash) external view returns (bool exists, bool pending)',
  'function getValidatorType(uint256 agentId) external view returns (uint8 validatorType)',
  'function setValidatorType(uint256 agentId, uint8 validatorType) external',
  'event ValidationRequestEvent(uint256 indexed agentValidatorId, uint256 indexed agentServerId, bytes32 indexed dataHash)',
  'event TEEValidationRequestEvent(uint256 indexed agentValidatorId, uint256 indexed agentServerId, bytes32 indexed dataHash, bytes32 measurementHash)'
];

interface ContractAddresses {
  teeVerifier: string;
  identityRegistry: string;
  reputationRegistry: string;
  validationRegistry: string;
}

interface AgentInfo {
  agentId: number;
  agentDomain: string;
  agentAddress: string;
  teeMeasurementHash: string;
  domainVerified: boolean;
  rootPubKeyHash: string;
}

interface TrustedMeasurement {
  measurementHash: string;
  description: string;
  addedAt: number;
  active: boolean;
}
export function useTEEContracts() {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Contract addresses from environment
  const addresses: ContractAddresses = useMemo(() => ({
    teeVerifier: process.env.NEXT_PUBLIC_TEE_VERIFIER!,
    identityRegistry: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY!,
    reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY!,
    validationRegistry: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY!
  }), []);

  // DRPC Provider initialization
  const rpcProvider = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) return null;
    
    return new ethers.JsonRpcProvider(rpcUrl);
  }, []);

  // Contract instances
  const contracts = useMemo(() => {
    if (!rpcProvider || !addresses.identityRegistry) return null;

    const currentProvider = signer || rpcProvider;

    return {
      identity: new ethers.Contract(addresses.identityRegistry, IDENTITY_REGISTRY_ABI, currentProvider),
      teeVerifier: new ethers.Contract(addresses.teeVerifier, TEE_VERIFIER_ABI, currentProvider),
      reputation: new ethers.Contract(addresses.reputationRegistry, REPUTATION_REGISTRY_ABI, currentProvider),
      validation: new ethers.Contract(addresses.validationRegistry, VALIDATION_REGISTRY_ABI, currentProvider)
    };
  }, [addresses, rpcProvider, signer]);

  useEffect(() => {
    if (rpcProvider) {
      setProvider(rpcProvider);
      rpcProvider.getNetwork().then(network => {
        setChainId(Number(network.chainId));
      }).catch(console.error);
    }
  }, [rpcProvider]);

  // Connect wallet
  const connectWallet = async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected');
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setSigner(signer);
      setUserAddress(address);
      setConnected(true);

      return true;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return false;
    }
  };

  // Register standard agent
  const registerAgent = async (domain: string): Promise<{ success: boolean; agentId?: number; error?: string }> => {
    if (!contracts?.identity || !signer) {
      return { success: false, error: 'Contract not initialized or wallet not connected' };
    }

    setLoading(true);
    try {
      const fee = await contracts.identity.REGISTRATION_FEE();
      const tx = await contracts.identity.newAgent(domain, userAddress, { value: fee });
      const receipt = await tx.wait();
      
      const event = receipt.events?.find((e: any) => e.event === 'AgentRegistered');
      const agentId = event?.args?.agentId?.toNumber();

      setLoading(false);
      return { success: true, agentId };
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Register TEE agent with attestation
  const registerTEEAgent = async (
    domain: string, 
    measurementHash: string, 
    attestationProof: string
  ): Promise<{ success: boolean; agentId?: number; error?: string }> => {
    if (!contracts?.identity || !signer) {
      return { success: false, error: 'Contract not initialized or wallet not connected' };
    }

    setLoading(true);
    try {
      const fee = await contracts.identity.REGISTRATION_FEE();
      const tx = await contracts.identity.newAgentWithTEE(
        domain,
        userAddress,
        measurementHash,
        attestationProof,
        { value: fee }
      );
      const receipt = await tx.wait();
      
      const event = receipt.events?.find((e: any) => e.event === 'AgentRegistered');
      const agentId = event?.args?.agentId?.toNumber();

      setLoading(false);
      return { success: true, agentId };
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Verify domain with RA-TLS certificate
  const verifyDomain = async (
    agentId: number, 
    rootPubKeyHash: string, 
    certificateProof: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!contracts?.identity || !signer) {
      return { success: false, error: 'Contract not initialized or wallet not connected' };
    }

    setLoading(true);
    try {
      const tx = await contracts.identity.verifyDomain(agentId, rootPubKeyHash, certificateProof);
      await tx.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Get agent information
  const getAgent = async (agentId: number): Promise<AgentInfo | null> => {
    if (!contracts?.identity) return null;

    try {
      const info = await contracts.identity.getAgent(agentId);
      return {
        agentId: info.agentId.toNumber(),
        agentDomain: info.agentDomain,
        agentAddress: info.agentAddress,
        teeMeasurementHash: info.teeMeasurementHash,
        domainVerified: info.domainVerified,
        rootPubKeyHash: info.rootPubKeyHash
      };
    } catch (error) {
      console.error('Failed to get agent info:', error);
      return null;
    }
  };

  // Check TEE attestation status
  const checkTEEStatus = async (agentId: number): Promise<{hasTEE: boolean; domainVerified: boolean}> => {
    if (!contracts?.identity) return { hasTEE: false, domainVerified: false };

    try {
      const [hasTEE, domainVerified] = await Promise.all([
        contracts.identity.hasTEEAttestation(agentId),
        contracts.identity.isDomainVerified(agentId)
      ]);

      return { hasTEE, domainVerified };
    } catch (error) {
      console.error('Failed to check TEE status:', error);
      return { hasTEE: false, domainVerified: false };
    }
  };

  // Calculate feedback weight
  const calculateFeedbackWeight = async (
    clientId: number, 
    serverId: number
  ): Promise<{weight: number; teeVerified: boolean} | null> => {
    if (!contracts?.reputation) return null;

    try {
      const result = await contracts.reputation.calculateFeedbackWeight(clientId, serverId);
      return {
        weight: result.weight.toNumber(),
        teeVerified: result.teeVerified
      };
    } catch (error) {
      console.error('Failed to calculate feedback weight:', error);
      return null;
    }
  };

  // Get trusted measurements
  const getTrustedMeasurements = async (): Promise<TrustedMeasurement[]> => {
    if (!contracts?.teeVerifier) return [];

    try {
      const measurements = await contracts.teeVerifier.getTrustedMeasurements();
      return measurements.map((m: any) => ({
        measurementHash: m.measurementHash,
        description: m.description,
        addedAt: m.addedAt.toNumber(),
        active: m.active
      }));
    } catch (error) {
      console.error('Failed to get trusted measurements:', error);
      return [];
    }
  };

  // Fetch Phala attestation via API
  const fetchPhalaAttestation = async (appId: string): Promise<{ quoteData: string; attestationHash: string } | null> => {
    try {
      const response = await fetch(`${process.env.PHALA_ATTESTATION_ENDPOINT}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PHALA_API_KEY}`
        },
        body: JSON.stringify({
          app_id: appId,
          include_quote: true
        })
      });

      if (!response.ok) {
        throw new Error(`Phala API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        quoteData: data.quote,
        attestationHash: data.checksum
      };
    } catch (error) {
      console.error('Phala attestation fetch failed:', error);
      return null;
    }
  };

  return {
    // State
    provider,
    signer,
    userAddress,
    chainId,
    connected,
    loading,
    contracts,
    addresses,

    // Actions
    connectWallet,
    registerAgent,
    registerTEEAgent,
    verifyDomain,
    getAgent,
    checkTEEStatus,
    calculateFeedbackWeight,
    getTrustedMeasurements,
    fetchPhalaAttestation
  };
}

// Extend Window interface
declare global {
  interface Window {
    ethereum?: any;
  }
}
