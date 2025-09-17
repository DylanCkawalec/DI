import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface ContractAddresses {
  teeVerifier: string;
  identityRegistry: string;
  reputationRegistry: string;
  validationRegistry: string;
}

interface ERC8004Contracts {
  identityRegistry: ethers.Contract | null;
  validationRegistry: ethers.Contract | null;
  reputationRegistry: ethers.Contract | null;
  teeVerifier: ethers.Contract | null;
  addresses: ContractAddresses;
  isConnected: boolean;
}

// Contract ABIs (minimal for required functions)
const IDENTITY_REGISTRY_ABI = [
  // Write functions
  'function newAgent(string calldata agentDomain, address agentAddress) external payable returns (uint256 agentId)',
  'function newAgentWithTEE(string calldata agentDomain, address agentAddress, bytes32 measurementHash, bytes calldata attestationProof) external payable returns (uint256 agentId)',
  
  // Read functions  
  'function getAgent(uint256 agentId) external view returns (tuple(uint256 agentId, string agentDomain, address agentAddress, uint256 timestamp))',
  'function getAgentCount() external view returns (uint256)',
  'function REGISTRATION_FEE() external pure returns (uint256)',
  'function resolveByAddress(address agentAddress) external view returns (tuple(uint256 agentId, string agentDomain, address agentAddress, uint256 timestamp))',
  
  // Events
  'event AgentRegistered(uint256 indexed agentId, string agentDomain, address indexed agentAddress)',
];

const VALIDATION_REGISTRY_ABI = [
  // Write functions (FREE - no value required!)
  'function validationRequest(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash) external',
  'function validationResponse(bytes32 dataHash, uint8 response) external',
  
  // Read functions
  'function isValidationPending(bytes32 dataHash) external view returns (bool exists, bool pending)',
  'function getValidationResponse(bytes32 dataHash) external view returns (bool hasResponse, uint8 response)',
  'function getValidationRequest(bytes32 dataHash) external view returns (tuple(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash, uint256 timestamp, bool responded))',
  
  // Events
  'event ValidationRequestEvent(uint256 indexed agentValidatorId, uint256 indexed agentServerId, bytes32 indexed dataHash)',
  'event ValidationResponseEvent(uint256 indexed agentValidatorId, uint256 indexed agentServerId, bytes32 indexed dataHash, uint8 response)',
];

const REPUTATION_REGISTRY_ABI = [
  // Write functions (FREE - no value required!)
  'function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external',
  'function acceptTEEFeedback(uint256 agentClientId, uint256 agentServerId, bytes32 measurementHash, bytes calldata attestationProof) external',
  
  // Read functions
  'function calculateFeedbackWeight(uint256 agentClientId, uint256 agentServerId) external view returns (uint256 weight, bool teeVerified)',
  
  // Events
  'event AuthFeedback(uint256 indexed agentClientId, uint256 indexed agentServerId, bytes32 indexed feedbackAuthId)',
];

export function useERC8004Contracts(provider?: ethers.BrowserProvider): ERC8004Contracts {
  const [contracts, setContracts] = useState<ERC8004Contracts>({
    identityRegistry: null,
    validationRegistry: null,
    reputationRegistry: null,
    teeVerifier: null,
    addresses: {
      teeVerifier: process.env.NEXT_PUBLIC_TEE_VERIFIER || '',
      identityRegistry: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || '',
      reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY || '',
      validationRegistry: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY || ''
    },
    isConnected: false
  });

  useEffect(() => {
    const initializeContracts = async () => {
      if (!provider) {
        setContracts(prev => ({ ...prev, isConnected: false }));
        return;
      }

      try {
        const signer = await provider.getSigner();
        
        // Create contract instances
        const identityRegistry = new ethers.Contract(
          contracts.addresses.identityRegistry,
          IDENTITY_REGISTRY_ABI,
          signer
        );
        
        const validationRegistry = new ethers.Contract(
          contracts.addresses.validationRegistry,
          VALIDATION_REGISTRY_ABI,
          signer
        );
        
        const reputationRegistry = new ethers.Contract(
          contracts.addresses.reputationRegistry,
          REPUTATION_REGISTRY_ABI,
          signer
        );
        
        setContracts(prev => ({
          ...prev,
          identityRegistry,
          validationRegistry,
          reputationRegistry,
          isConnected: true
        }));
        
      } catch (error) {
        console.error('Failed to initialize contracts:', error);
        setContracts(prev => ({ ...prev, isConnected: false }));
      }
    };

    initializeContracts();
  }, [provider]);

  return contracts;
}

// Helper functions for contract interactions
export const erc8004ContractHelpers = {
  
  /**
   * Register a new agent following ERC-8004 spec
   */
  async registerAgent(
    contracts: ERC8004Contracts,
    agentDomain: string,
    agentAddress: string,
    useTEE: boolean = false,
    teeData?: { measurementHash: string; attestationProof: string }
  ): Promise<{ success: boolean; agentId?: number; txHash?: string; error?: string }> {
    
    if (!contracts.identityRegistry || !contracts.isConnected) {
      return { success: false, error: 'Contracts not initialized' };
    }

    try {
      // Get registration fee
      const registrationFee = await contracts.identityRegistry.REGISTRATION_FEE();
      
      let tx: ethers.ContractTransactionResponse;
      
      if (useTEE && teeData) {
        // TEE registration
        tx = await contracts.identityRegistry.newAgentWithTEE(
          agentDomain,
          agentAddress,
          teeData.measurementHash,
          teeData.attestationProof,
          { value: registrationFee }
        );
      } else {
        // Standard registration
        tx = await contracts.identityRegistry.newAgent(
          agentDomain,
          agentAddress,
          { value: registrationFee }
        );
      }
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        // Get agent count to determine new agent ID
        const agentCount = await contracts.identityRegistry.getAgentCount();
        
        return {
          success: true,
          agentId: Number(agentCount),
          txHash: receipt.hash
        };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  },

  /**
   * Submit validation request (FREE per ERC-8004 spec)
   */
  async submitValidationRequest(
    contracts: ERC8004Contracts,
    validatorAgentId: number,
    serverAgentId: number,
    codeData: string
  ): Promise<{ success: boolean; dataHash?: string; txHash?: string; error?: string }> {
    
    if (!contracts.validationRegistry || !contracts.isConnected) {
      return { success: false, error: 'Validation registry not available' };
    }

    try {
      // Create data hash from code
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(codeData));
      
      // Submit validation request (NO VALUE - FREE!)
      const tx = await contracts.validationRegistry.validationRequest(
        validatorAgentId,
        serverAgentId,
        dataHash
        // NO VALUE PARAMETER - this is FREE per ERC-8004 spec
      );
      
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return {
          success: true,
          dataHash: dataHash,
          txHash: receipt.hash
        };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Validation request failed'
      };
    }
  },

  /**
   * Submit validation response (called by validator agent)
   */
  async submitValidationResponse(
    contracts: ERC8004Contracts,
    dataHash: string,
    validationScore: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    
    if (!contracts.validationRegistry || !contracts.isConnected) {
      return { success: false, error: 'Validation registry not available' };
    }

    try {
      // Submit validation response (NO VALUE - FREE!)
      const tx = await contracts.validationRegistry.validationResponse(
        dataHash,
        Math.min(100, Math.max(0, validationScore)) // Ensure 0-100 range
      );
      
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return {
          success: true,
          txHash: receipt.hash
        };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Validation response failed'
      };
    }
  },

  /**
   * Accept feedback authorization (FREE per ERC-8004 spec)
   */
  async acceptFeedback(
    contracts: ERC8004Contracts,
    clientAgentId: number,
    serverAgentId: number
  ): Promise<{ success: boolean; feedbackAuthId?: string; txHash?: string; error?: string }> {
    
    if (!contracts.reputationRegistry || !contracts.isConnected) {
      return { success: false, error: 'Reputation registry not available' };
    }

    try {
      // Accept feedback authorization (NO VALUE - FREE!)
      const tx = await contracts.reputationRegistry.acceptFeedback(
        clientAgentId,
        serverAgentId
      );
      
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        // Generate feedback auth ID from transaction
        const feedbackAuthId = ethers.keccak256(
          ethers.solidityPacked(
            ['uint256', 'uint256', 'uint256'],
            [clientAgentId, serverAgentId, receipt.blockNumber]
          )
        );
        
        return {
          success: true,
          feedbackAuthId: feedbackAuthId,
          txHash: receipt.hash
        };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Feedback authorization failed'
      };
    }
  },

  /**
   * Get agent information by ID
   */
  async getAgent(
    contracts: ERC8004Contracts,
    agentId: number
  ): Promise<{ success: boolean; agent?: any; error?: string }> {
    
    if (!contracts.identityRegistry) {
      return { success: false, error: 'Identity registry not available' };
    }

    try {
      const agentInfo = await contracts.identityRegistry.getAgent(agentId);
      
      return {
        success: true,
        agent: {
          agentId: Number(agentInfo[0]),
          agentDomain: agentInfo[1],
          agentAddress: agentInfo[2],
          timestamp: Number(agentInfo[3])
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get agent'
      };
    }
  }
};


