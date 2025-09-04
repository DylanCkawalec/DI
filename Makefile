# ERC-8004 Trustless Agents - Phala Cloud Edition
# Makefile for building, testing, and deployment

.PHONY: help install build deploy test clean

# Default target
help:
	@echo "ERC-8004 Trustless Agents - Available Commands:"
	@echo ""
	@echo "  make install      - Install all dependencies via Flox"
	@echo "  make build        - Build smart contracts"
	@echo "  make deploy       - Deploy contracts to local blockchain"
	@echo "  make test         - Run all tests"
	@echo "  make test-unit    - Run unit tests only"
	@echo "  make test-int     - Run integration tests only"
	@echo "  make test-e2e     - Run end-to-end tests only"
	@echo "  make test-tee     - Run TEE simulator tests"
	@echo "  make anvil        - Start Anvil blockchain"
	@echo "  make tee-start    - Start TEE simulator"
	@echo "  make tee-stop     - Stop TEE simulator"
	@echo "  make tee-status   - Check TEE simulator status"
	@echo "  make clean        - Clean build artifacts"
	@echo ""

# Install dependencies
install:
	@echo "🚀 Activating Flox environment..."
	flox activate
	@echo "📦 Installing Python dependencies..."
	flox activate -- pip install pytest pytest-cov pytest-xdist web3 python-dotenv
	@echo "✅ Dependencies installed"

# Build smart contracts
build:
	@echo "🔨 Building smart contracts..."
	cd contracts && flox activate -- forge build
	@echo "✅ Contracts built"

# Start Anvil blockchain
anvil:
	@echo "⚡ Starting Anvil blockchain..."
	flox activate -- anvil

# Deploy contracts
deploy:
	@echo "📄 Deploying contracts to local blockchain..."
	cd contracts && flox activate -- forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
	@echo "✅ Contracts deployed"

# Run all tests
test:
	@echo "🧪 Running all tests..."
	flox activate -- python -m pytest tests/ -v --color=yes

# Run unit tests only
test-unit:
	@echo "🧪 Running unit tests..."
	flox activate -- python -m pytest tests/unit/ -v --color=yes -m unit

# Run integration tests only
test-int:
	@echo "🧪 Running integration tests..."
	flox activate -- python -m pytest tests/integration/ -v --color=yes -m integration

# Run end-to-end tests only
test-e2e:
	@echo "🧪 Running end-to-end tests..."
	flox activate -- python -m pytest tests/e2e/ -v --color=yes -m e2e

# Run tests with coverage
test-cov:
	@echo "📊 Running tests with coverage..."
	flox activate -- python -m pytest tests/ --cov=agents --cov-report=html --cov-report=term

# Run specific test file
test-file:
	@echo "🧪 Running test file: $(FILE)"
	flox activate -- python -m pytest $(FILE) -v --color=yes

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf contracts/out contracts/cache
	rm -rf .pytest_cache __pycache__ agents/__pycache__
	rm -rf htmlcov .coverage
	rm -rf data/*.json validations/*.json
	@echo "✅ Clean complete"

# Quick test - runs fast tests only
quick-test:
	@echo "⚡ Running quick tests (no slow tests)..."
	flox activate -- python -m pytest tests/ -v --color=yes -m "not slow"

# Foundry convenience (no Flox wrapper required)
foundry-test:
	@echo "🧪 Running Foundry tests..."
	forge test -C contracts -vvv

foundry-build:
	@echo "🔨 Building contracts (Foundry)..."
	forge build -C contracts

foundry-deploy-local:
	@echo "📄 Deploying via Foundry to local RPC..."
	RPC_URL?=http://127.0.0.1:8545; \
	cd contracts && forge script script/Deploy.s.sol:Deploy --rpc-url $$RPC_URL --broadcast

local-anvil:
	@echo "⚡ Starting local Anvil (Ctrl+C to stop)..."
	anvil

local-test-anvil:
	@echo "🧪 Running local Anvil helper (spawns Anvil if needed, deploys, updates .env)..."
	python scripts/test_local_anvil.py

# Full workflow test
test-workflow:
	@echo "🔄 Running complete workflow test..."
	@make build
	@make deploy
	@make test-e2e

# TEE Simulator commands
tee-setup:
	@echo "🔨 Setting up TEE simulator..."
	flox activate -- ./scripts/setup_tee_simulator.sh setup

tee-start:
	@echo "🚀 Starting TEE simulator..."
	flox activate -- ./scripts/setup_tee_simulator.sh start

tee-stop:
	@echo "🛑 Stopping TEE simulator..."
	flox activate -- ./scripts/setup_tee_simulator.sh stop

tee-restart:
	@echo "🔄 Restarting TEE simulator..."
	flox activate -- ./scripts/setup_tee_simulator.sh restart

tee-status:
	@echo "📊 TEE simulator status..."
	flox activate -- ./scripts/setup_tee_simulator.sh status

tee-logs:
	@echo "📋 TEE simulator logs..."
	flox activate -- ./scripts/setup_tee_simulator.sh logs

# Run TEE integration tests
test-tee:
	@echo "🧪 Running TEE integration tests..."
	flox activate -- python -m pytest tests/integration/test_tee_sdk.py tests/integration/test_tee_simulator.py -v --color=yes