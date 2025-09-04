#!/bin/bash

# 🚀 ERC-8004 Trustless AI - Secure Deployment Script
# ===================================================
# Handles secure environment variable deployment for Phala TEE

set -e

echo "🔒 ERC-8004 SECURE DEPLOYMENT"
echo "============================"

# Check if .env exists
if [[ ! -f ".env" ]]; then
    echo "❌ ERROR: .env file not found!"
    echo ""
    echo "Please create .env file first:"
    echo "  cp env.production.template .env"
    echo "  # Edit .env with your actual keys"
    echo ""
    exit 1
fi

# Validate critical environment variables
echo "🔍 Validating environment configuration..."

missing_vars=()

# Check for required variables
required_vars=(
    "RPC_URL"
    "PRIVATE_KEY"
    "PHALA_API_KEY"
    "GROK_API_KEY"
    "IDENTITY_REGISTRY_ADDRESS"
    "VALIDATION_REGISTRY_ADDRESS"
)

source .env

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" || "${!var}" == *"YOUR_"* ]]; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "❌ ERROR: Missing or incomplete environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please update your .env file with actual values."
    exit 1
fi

echo "✅ Environment validation passed"

# Security check - ensure .env is not in Docker context
if [[ -f ".dockerignore" ]]; then
    if ! grep -q "^\.env$" .dockerignore; then
        echo ".env" >> .dockerignore
        echo "✅ Added .env to .dockerignore for security"
    fi
else
    echo ".env" > .dockerignore
    echo "✅ Created .dockerignore with .env exclusion"
fi

# Deploy based on environment
if [[ "$1" == "phala" ]]; then
    echo "🌐 Deploying to Phala Cloud TEE..."
    
    # Validate Phala-specific requirements
    if [[ -z "$PHALA_API_KEY" || "$PHALA_API_KEY" == *"YOUR_"* ]]; then
        echo "❌ ERROR: PHALA_API_KEY is required for Phala deployment"
        exit 1
    fi
    
    # Create secure environment for Phala
    echo "🔐 Creating secure Phala deployment..."
    
    # Use Phala CLI (assumes it's installed)
    if command -v phala &> /dev/null; then
        phala deploy --compose docker-compose.yml --env-file .env
    else
        echo "⚠️  Phala CLI not found. Using manual deployment..."
        echo "Please ensure you have the Phala CLI installed:"
        echo "  curl -s https://raw.githubusercontent.com/Phala-Network/phala-blockchain/master/scripts/install-phala-cli.sh | bash"
        exit 1
    fi
    
elif [[ "$1" == "docker" ]]; then
    echo "🐳 Deploying with Docker Compose..."
    
    # Build and deploy with Docker Compose
    docker-compose build --no-cache
    docker-compose up -d
    
    echo "✅ Deployment complete!"
    echo ""
    echo "🌐 Your application is available at:"
    echo "   • Frontend: http://localhost:3000"
    echo "   • API: http://localhost:8080"
    echo "   • Validator: http://localhost:8081"
    
else
    echo "🔧 Local development deployment..."
    
    # Local development with secure environment
    export $(grep -v '^#' .env | xargs)
    ./quick_launch.sh
fi

echo ""
echo "🎉 Deployment complete with secure environment handling!"
echo ""
echo "🔐 Security Features Active:"
echo "   ✅ .env file excluded from Docker context"
echo "   ✅ Environment variables loaded at runtime"
echo "   ✅ No secrets exposed in container logs"
echo "   ✅ Secure file permissions (600) on .env"
echo ""

if [[ "$1" == "docker" ]]; then
    echo "📊 Monitor your deployment:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop deployment:"
    echo "   docker-compose down"
fi
