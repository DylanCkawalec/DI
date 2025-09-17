import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface ContractStatus {
  address: string;
  name: string;
  connected: boolean;
  agentCount?: number;
  registrationFee?: string;
  trustedMeasurements?: number;
  lastBlock?: number;
  error?: string;
}

interface ContractStatusMonitorProps {
  rpcUrl?: string;
}

const ContractStatusMonitor: React.FC<ContractStatusMonitorProps> = ({ 
  rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj'
}) => {
  const [contractStatuses, setContractStatuses] = useState<ContractStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Contract addresses from environment
  const contracts = [
    {
      name: 'TEEVerifier',
      address: process.env.NEXT_PUBLIC_TEE_VERIFIER || '0x75e8FEb5820DC4d0E795F0517646212BBB4fB41A'
    },
    {
      name: 'IdentityRegistry', 
      address: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || '0x4bE957cceC6aEc4258F2419BcAF5B5341B14052f'
    },
    {
      name: 'ReputationRegistry',
      address: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY || '0xCd42dF97D96CB4aB35f985F8133786386BBbFc5d'
    },
    {
      name: 'ValidationRegistry',
      address: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY || '0x4EB31a7bB1134872c980d6cfbd8A9DFF5b39f795'
    }
  ];

  // Simple ABIs for basic contract calls
  const IDENTITY_REGISTRY_ABI = [
    'function getAgentCount() external view returns (uint256)',
    'function REGISTRATION_FEE() external pure returns (uint256)'
  ];

  const TEE_VERIFIER_ABI = [
    'function getTrustedMeasurements() external view returns (tuple(bytes32 measurementHash, string description, uint256 addedAt, bool active)[])'
  ];

  const checkContractStatus = async (contractInfo: { name: string; address: string }): Promise<ContractStatus> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const currentBlock = await provider.getBlockNumber();
      
      const status: ContractStatus = {
        address: contractInfo.address,
        name: contractInfo.name,
        connected: true,
        lastBlock: currentBlock
      };

      // Check specific contract functions based on type
      if (contractInfo.name === 'IdentityRegistry') {
        try {
          const contract = new ethers.Contract(contractInfo.address, IDENTITY_REGISTRY_ABI, provider);
          const agentCount = await contract.getAgentCount();
          const regFee = await contract.REGISTRATION_FEE();
          
          status.agentCount = Number(agentCount);
          status.registrationFee = ethers.formatEther(regFee);
        } catch (e) {
          status.error = `Contract call failed: ${e}`;
        }
      } else if (contractInfo.name === 'TEEVerifier') {
        try {
          const contract = new ethers.Contract(contractInfo.address, TEE_VERIFIER_ABI, provider);
          const measurements = await contract.getTrustedMeasurements();
          status.trustedMeasurements = measurements.length;
        } catch (e) {
          status.error = `Contract call failed: ${e}`;
        }
      }

      return status;

    } catch (error) {
      return {
        address: contractInfo.address,
        name: contractInfo.name,
        connected: false,
        error: `Connection failed: ${error}`
      };
    }
  };

  const updateAllStatuses = async () => {
    setLoading(true);
    try {
      const statuses = await Promise.all(
        contracts.map(contract => checkContractStatus(contract))
      );
      setContractStatuses(statuses);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to update contract statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateAllStatuses();
    
    // Update every 30 seconds
    const interval = setInterval(updateAllStatuses, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ContractStatus): string => {
    if (!status.connected || status.error) return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusIcon = (status: ContractStatus): string => {
    if (!status.connected || status.error) return '❌';
    return '✅';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Contract Status Monitor</h3>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={updateAllStatuses}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contractStatuses.map((status) => (
          <div
            key={status.address}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getStatusIcon(status)}</span>
                <h4 className="font-medium text-gray-800">{status.name}</h4>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                {status.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-xs text-gray-600 mb-2 font-mono break-all">
              {status.address}
            </div>

            {status.error && (
              <div className="text-xs text-red-600 mb-2">
                {status.error}
              </div>
            )}

            <div className="text-sm text-gray-700 space-y-1">
              {status.lastBlock && (
                <div>Latest Block: #{status.lastBlock}</div>
              )}
              
              {status.name === 'IdentityRegistry' && status.agentCount !== undefined && (
                <>
                  <div>Agents Registered: {status.agentCount}</div>
                  <div>Registration Fee: {status.registrationFee} ETH</div>
                </>
              )}
              
              {status.name === 'TEEVerifier' && status.trustedMeasurements !== undefined && (
                <div>Trusted Measurements: {status.trustedMeasurements}</div>
              )}
            </div>

            {status.connected && !status.error && (
              <div className="mt-2 text-xs text-green-600">
                ✓ Contract responding normally
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>Network: Base Sepolia (Chain ID: 84532)</span>
          <span>•</span>
          <span>RPC: {rpcUrl.replace(/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj/, '***')}</span>
        </div>
      </div>
    </div>
  );
};

export default ContractStatusMonitor;
