/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // JSX Runtime Configuration
  compiler: {
    removeConsole: false,
  },
  
  // Environment variables that should be available to the frontend
  env: {
    // Only include non-sensitive environment variables here
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_VALIDATOR_URL: process.env.NEXT_PUBLIC_VALIDATOR_URL || 'http://localhost:8081',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '84532',
    NEXT_PUBLIC_IDENTITY_REGISTRY: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY,
    NEXT_PUBLIC_VALIDATION_REGISTRY: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY,
    // Note: Etherscan API key is passed via server-side API routes only
    NEXT_PUBLIC_NETWORK_NAME: 'Base Sepolia'
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure sensitive environment variables are not bundled
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.PHALA_API_KEY': JSON.stringify(undefined),
        'process.env.PRIVATE_KEY': JSON.stringify(undefined),
        'process.env.GROK_API_KEY': JSON.stringify(undefined),
        'process.env.OPENAI_API_KEY': JSON.stringify(undefined),
        'process.env.ANTHROPIC_API_KEY': JSON.stringify(undefined),
        'process.env.ETHERSCAN_API_KEY': JSON.stringify(undefined),
      })
    );
    
    return config;
  },
  
  
  // Experimental features
  experimental: {
    esmExternals: false
  },
  
  // Output configuration
  output: 'standalone',
  trailingSlash: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  
  // Image configuration
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
};

module.exports = nextConfig;