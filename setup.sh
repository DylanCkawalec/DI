#!/bin/bash

# ERC-8004 Example Setup Script
# This script automates the setup process for the ERC-8004 example

set -e  # Exit on any error

echo "🚀 ERC-8004 Trustless Agents Example Setup"
echo "=========================================="
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    echo "Please install pip3 and try again."
    exit 1
fi

echo "✅ pip3 found"

# Install Python dependencies
echo
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo
    echo "🔧 Foundry not found. Installing Foundry..."
    # Install foundryup (adds ~/.foundry/bin and updates your shell profile)
    curl -L https://foundry.paradigm.xyz | bash

    # Ensure Foundry is available in this script session without relying on shell RC files
    FOUNDRY_BIN="$HOME/.foundry/bin"
    if [ -d "$FOUNDRY_BIN" ]; then
        export PATH="$FOUNDRY_BIN:$PATH"
    fi

    # Install/upgrade Foundry toolchain non-interactively
    if [ -x "$FOUNDRY_BIN/foundryup" ]; then
        "$FOUNDRY_BIN/foundryup"
    else
        # Fallback in case PATH was updated by the installer
        foundryup
    fi

    # Verify installation
    if command -v forge &> /dev/null; then
        echo "✅ Foundry installed: $(forge --version | head -n1)"
    else
        echo "❌ Foundry installation did not complete successfully. Please open a new terminal session and re-run ./setup.sh"
        exit 1
    fi
else
    echo "✅ Foundry found: $(forge --version | head -n1)"
fi

# Setup contracts
echo
echo "🏗️  Setting up smart contracts..."
cd contracts

# Install Foundry dependencies
if [ ! -d "lib/forge-std" ]; then
    echo "📦 Installing Foundry dependencies (forge-std)..."
    # If a lockfile pins forge-std, honor it; otherwise install latest
    if [ -f "foundry.lock" ]; then
        FORGE_STD_VERSION=$(awk '/"lib\/forge-std"/{flag=1;next}/}/{flag=0}flag && /"name"/ {gsub(/[",]/, ""); print $3; exit}' foundry.lock)
    fi
    if [ -n "$FORGE_STD_VERSION" ]; then
        echo "🔒 Using forge-std version pinned in foundry.lock: $FORGE_STD_VERSION"
        forge install "foundry-rs/forge-std@$FORGE_STD_VERSION"
    else
        forge install foundry-rs/forge-std
    fi
fi

# Compile contracts
echo "🔨 Compiling contracts..."
forge build

cd ..

# Setup environment
if [ ! -f ".env" ]; then
    echo
    echo "⚙️  Setting up environment configuration..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env file with your configuration before running the demo"
else
    echo "✅ .env file already exists"
fi

# Create data directories
mkdir -p data validations

echo
# Setup frontend
echo
echo "🌐 Setting up frontend..."
cd frontend

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

cd ..

echo
echo "🎉 Complete ERC-8004 AI Code Review Service Setup Complete!"
echo "=========================================================="
echo "✅ Python dependencies installed"  
echo "✅ Foundry and contracts ready"
echo "✅ Frontend built and ready"
echo "✅ Environment configured"
echo
echo "🚀 Quick Start Options:"
echo "1. Complete Demo: python START_APPLICATION.py (choose 1)"
echo "2. Full Stack:    python START_APPLICATION.py (choose 2)"
echo "3. AI Test:       python test_all_ai_providers.py"
echo "4. Deploy Base:   python START_APPLICATION.py (choose 4)"
echo
echo "🌐 Access Points (when running):"
echo "   • Frontend:     http://localhost:3000"
echo "   • Server API:   http://localhost:8080/docs"
echo "   • Validator:    http://localhost:8081/docs"
echo "   • Blockchain:   http://localhost:8545"
echo
echo "📚 Documentation:"
echo "   • QUICK_START.md     - Quick testing guide"
echo "   • PRODUCTION_READY.md - Complete deployment guide"
echo "   • ERC8004-spec.md    - Protocol specification"
echo
echo "🚀 Ready to run! Execute: python START_APPLICATION.py" 
