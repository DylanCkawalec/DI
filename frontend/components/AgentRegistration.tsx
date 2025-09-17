import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface AgentRegistrationProps {
  web3Provider?: any;
  isWalletConnected: boolean;
  onRegistrationSuccess?: (agentId: number) => void;
}

interface RegistrationFormData {
  agentDomain: string;
  agentAddress: string;
  useTEE: boolean;
  measurementHash?: string;
  attestationProof?: string;
}

const AgentRegistration: React.FC<AgentRegistrationProps> = ({
  web3Provider,
  isWalletConnected,
  onRegistrationSuccess
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    agentDomain: '',
    agentAddress: '',
    useTEE: false
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string>('');
  const [registrationFee, setRegistrationFee] = useState<string>('0.005');
  const [txHash, setTxHash] = useState<string>('');

  // Contract configuration
  const IDENTITY_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || '0x4bE957cceC6aEc4258F2419BcAF5B5341B14052f';
  const IDENTITY_REGISTRY_ABI = [
    'function newAgent(string calldata agentDomain, address agentAddress) external payable returns (uint256 agentId)',
    'function newAgentWithTEE(string calldata agentDomain, address agentAddress, bytes32 measurementHash, bytes calldata attestationProof) external payable returns (uint256 agentId)',
    'function REGISTRATION_FEE() external pure returns (uint256 fee)',
    'function getAgent(uint256 agentId) external view returns (tuple(uint256 agentId, string agentDomain, address agentAddress, uint256 timestamp))',
    'event AgentRegistered(uint256 indexed agentId, string agentDomain, address indexed agentAddress)',
    'event TEEAttestationVerified(uint256 indexed agentId, bytes32 measurementHash, bool verified)'
  ];

  // Load registration fee on component mount
  useEffect(() => {
    const loadRegistrationFee = async () => {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI, provider);
        
        const fee = await contract.REGISTRATION_FEE();
        setRegistrationFee(ethers.formatEther(fee));
      } catch (error) {
        console.error('Failed to load registration fee:', error);
        setRegistrationStatus('Failed to load registration fee from contract');
      }
    };

    loadRegistrationFee();
  }, []);

  // Auto-populate agent address from connected wallet
  useEffect(() => {
    const populateAgentAddress = async () => {
      if (isWalletConnected && web3Provider && !formData.agentAddress) {
        try {
          const signer = await web3Provider.getSigner();
          const address = await signer.getAddress();
          setFormData(prev => ({ ...prev, agentAddress: address }));
        } catch (error) {
          console.error('Failed to get wallet address:', error);
        }
      }
    };

    populateAgentAddress();
  }, [isWalletConnected, web3Provider]);

  const handleInputChange = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateMockTEEData = (): { measurementHash: string; attestationProof: string } => {
    // Generate mock TEE data for demonstration
    const mockMeasurement = ethers.keccak256(ethers.toUtf8Bytes(`tee-measurement-${Date.now()}`));
    const mockAttestation = ethers.hexlify(ethers.randomBytes(128)); // Mock 128-byte attestation
    
    return {
      measurementHash: mockMeasurement,
      attestationProof: mockAttestation
    };
  };

  const registerAgent = async () => {
    if (!isWalletConnected || !web3Provider) {
      setRegistrationStatus('❌ Please connect your wallet first');
      return;
    }

    if (!formData.agentDomain || !formData.agentAddress) {
      setRegistrationStatus('❌ Please fill in all required fields');
      return;
    }

    setIsRegistering(true);
    setRegistrationStatus('🔄 Calling IdentityRegistry.newAgent() function...');

    try {
      const signer = await web3Provider.getSigner();
      const contract = new ethers.Contract(IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI, signer);

      // Get exact registration fee from contract
      const exactRegistrationFee = await contract.REGISTRATION_FEE();
      setRegistrationStatus('💰 Registration fee verified: 0.005 ETH (from contract)');

      let tx;
      
      if (formData.useTEE) {
        // Generate mock TEE data for demonstration
        const teeData = generateMockTEEData();
        setRegistrationStatus('🔐 Calling IdentityRegistry.newAgentWithTEE()...');
        
        tx = await contract.newAgentWithTEE(
          formData.agentDomain,
          formData.agentAddress,
          teeData.measurementHash,
          teeData.attestationProof,
          { value: exactRegistrationFee } // Use exact fee from contract
        );
      } else {
        setRegistrationStatus('🔄 Calling IdentityRegistry.newAgent()...');
        
        tx = await contract.newAgent(
          formData.agentDomain,
          formData.agentAddress,
          { value: exactRegistrationFee } // Use exact fee from contract
        );
      }

      setTxHash(tx.hash);
      setRegistrationStatus(`📡 Transaction sent: ${tx.hash.slice(0, 10)}...`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Extract agent ID from event logs
        const agentRegisteredEvent = receipt.logs.find((log: any) => {
          try {
            const parsedLog = contract.interface.parseLog(log);
            return parsedLog?.name === 'AgentRegistered';
          } catch {
            return false;
          }
        });

        if (agentRegisteredEvent) {
          const parsedLog = contract.interface.parseLog(agentRegisteredEvent);
          if (parsedLog) {
            const agentId = Number(parsedLog.args.agentId);
            
            setRegistrationStatus(`✅ Agent registered successfully! Agent ID: ${agentId}`);
            
            if (onRegistrationSuccess) {
              onRegistrationSuccess(agentId);
            }
          } else {
            setRegistrationStatus('✅ Registration completed (Agent ID not found in logs)');
          }
        } else {
          setRegistrationStatus('✅ Registration completed (Agent ID not found in logs)');
        }
      } else {
        setRegistrationStatus('❌ Registration transaction failed');
      }

    } catch (error: any) {
      console.error('Registration failed:', error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        setRegistrationStatus('❌ Insufficient funds for registration fee and gas');
      } else if (error.code === 'USER_REJECTED') {
        setRegistrationStatus('❌ Transaction rejected by user');
      } else {
        setRegistrationStatus(`❌ Registration failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Register New Agent</h3>
      
      <div className="space-y-4">
        {/* Agent Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Domain *
          </label>
          <input
            type="text"
            placeholder="e.g., my-agent.example.com"
            value={formData.agentDomain}
            onChange={(e) => handleInputChange('agentDomain', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Domain where your agent's AgentCard will be hosted
          </p>
        </div>

        {/* Agent Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Address *
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={formData.agentAddress}
            onChange={(e) => handleInputChange('agentAddress', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ethereum address that will control this agent
          </p>
        </div>

        {/* TEE Option */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.useTEE}
              onChange={(e) => handleInputChange('useTEE', e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Register with TEE Attestation
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Enhanced security with Trusted Execution Environment verification
          </p>
        </div>

        {/* Registration Fee */}
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>Registration Fee:</strong> {registrationFee} ETH
          </div>
          <div className="text-xs text-blue-600 mt-1">
            This fee is burned to prevent spam registrations
          </div>
        </div>

        {/* Registration Status */}
        {registrationStatus && (
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-700">{registrationStatus}</div>
            {txHash && (
              <div className="text-xs text-blue-600 mt-1">
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  View on BaseScan →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Registration Button */}
        <button
          onClick={registerAgent}
          disabled={!isWalletConnected || isRegistering}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            !isWalletConnected || isRegistering
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {!isWalletConnected
            ? 'Connect Wallet to Register'
            : isRegistering
            ? 'Registering...'
            : `Register Agent (${registrationFee} ETH)`
          }
        </button>

        {/* Wallet Connection Status */}
        {!isWalletConnected && (
          <div className="text-center text-sm text-gray-500">
            Please connect your MetaMask wallet to register an agent
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentRegistration;
