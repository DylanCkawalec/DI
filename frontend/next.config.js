/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable static export to fix build issues
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // Environment variables for the frontend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_VALIDATOR_API_URL: process.env.NEXT_PUBLIC_VALIDATOR_API_URL || 'http://localhost:8081',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://lb.drpc.org/base-sepolia/ArTAkftTl0UdjDU4KTEz4ohhAEm9iRER8IleqhnKxixj',
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '84532',
    NEXT_PUBLIC_IDENTITY_REGISTRY: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || '',
    NEXT_PUBLIC_REPUTATION_REGISTRY: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY || '',
    NEXT_PUBLIC_VALIDATION_REGISTRY: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY || '',
  },
  
  // Webpack configuration for Web3 compatibility
  webpack: (config, { dev, isServer }) => {
    // Handle Web3 and crypto polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
      }
    }
    
    // Handle node modules that don't play well with Next.js
    config.externals = config.externals || []
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    
    return config
  },
  
  // Disable webpack dev middleware on client side
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig
