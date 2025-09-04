// Next.js API route to provide runtime configuration
export default function handler(req: any, res: any) {
  const config = {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545',
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337'),
    contracts: {
      identityRegistry: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || '',
      reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY || '',
      validationRegistry: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY || ''
    },
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    networkName: process.env.NEXT_PUBLIC_CHAIN_ID === '84532' ? 'Base Sepolia' :
                 process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 'Base Mainnet' :
                 'Local Anvil'
  };
  
  res.status(200).json(config);
}
