import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { private_key, rpc_url, network } = req.body;

  if (!private_key || !rpc_url) {
    return res.status(400).json({ 
      error: 'Missing required parameters: private_key, rpc_url' 
    });
  }

  let deploymentError = '';

  try {
    console.log('🚀 Starting user contract deployment...');

    // Change to contracts directory for deployment
    const projectRoot = path.resolve(process.cwd(), '../');
    const contractsDir = path.join(projectRoot, 'contracts');

    // Create deployment environment
    const deployEnv = {
      ...process.env,
      PRIVATE_KEY: private_key,
      RPC_URL: rpc_url,
      CHAIN_ID: network === 'base_mainnet' ? '8453' : '84532'
    };

    // Run forge deployment
    const deploymentProcess = spawn('forge', [
      'script',
      'script/Deploy.s.sol:Deploy',
      '--rpc-url', rpc_url,
      '--broadcast',
      '--verify' // Optional verification
    ], {
      cwd: contractsDir,
      env: deployEnv,
      stdio: 'pipe'
    });

    let deploymentOutput = '';

    deploymentProcess.stdout.on('data', (data) => {
      deploymentOutput += data.toString();
    });

    deploymentProcess.stderr.on('data', (data) => {
      deploymentError += data.toString();
    });

    // Wait for deployment to complete
    await new Promise((resolve, reject) => {
      deploymentProcess.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Deployment failed with code ${code}: ${deploymentError}`));
        }
      });

      // Timeout after 120 seconds
      setTimeout(() => {
        deploymentProcess.kill();
        reject(new Error('Deployment timeout'));
      }, 120000);
    });

    console.log('✅ User contract deployment completed');

    // Try to read deployment results
    try {
      const fs = await import('fs');
      const deployedContractsPath = path.join(projectRoot, 'deployed_contracts.json');
      
      if (fs.existsSync(deployedContractsPath)) {
        const deploymentData = JSON.parse(fs.readFileSync(deployedContractsPath, 'utf8'));
        
        // Calculate deployment cost estimate
        const estimatedCost = 0.015; // Approximate cost in ETH
        
        return res.status(200).json({
          success: true,
          contracts: deploymentData.contracts,
          network: network,
          estimated_cost_eth: estimatedCost,
          estimated_cost_usd: estimatedCost * 3000, // Rough ETH price
          deployment_output: deploymentOutput,
          message: 'Contracts deployed successfully to your wallet!'
        });
      }
    } catch (fileError) {
      console.warn('Could not read deployment file:', fileError);
    }

    // Fallback response
    return res.status(200).json({
      success: true,
      message: 'Deployment completed - check transaction logs',
      deployment_output: deploymentOutput,
      network: network,
      note: 'Contract addresses will be available after blockchain confirmation'
    });

  } catch (error: any) {
    console.error('Contract deployment failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      deployment_error: deploymentError,
      note: 'Please check your private key and network connection'
    });
  }
}
