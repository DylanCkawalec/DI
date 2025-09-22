#!/bin/bash

# 🚀 FINAL ERC-8004 A2A LAUNCHER
# Bulletproof production launcher optimized for Docker and Phala TEE

set -e  # Exit on any error

echo "🔐 TEE-ENHANCED ERC-8004 A2A LAUNCHER"
echo "====================================="
echo "🎯 Starting cryptographically secured TEE system..."
echo

# Enhanced setup with better error handling
mkdir -p logs data sessions validations 2>/dev/null || true
chmod 755 logs data sessions validations 2>/dev/null || true

# TEE-Secure Environment Loading
if [[ -f ".env" && -z "$CONTAINER_MODE" ]]; then
    echo "📁 Loading environment from .env file (local development)..."
    export $(grep -v '^#' .env | xargs) 2>/dev/null || true
    echo "   Environment variables loaded"
elif [[ "$TEE_MODE" == "production" ]]; then
    echo "🔐 TEE Production Mode - Environment injected at runtime"
    echo "   Secrets loaded from TEE KMS/Environment"
    
    # Validate TEE-specific environment variables
    tee_vars=("TEE_VERIFIER_ADDRESS" "IDENTITY_REGISTRY_ADDRESS" "PHALA_API_KEY")
    for var in "${tee_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "❌ ERROR: TEE variable $var not found in environment"
            echo "   This should be injected by the TEE runtime"
            exit 1
        fi
    done
    echo "✅ TEE environment variables validated"
fi

# Validate critical environment variables (no fallbacks)
if [[ -z "$RPC_URL" ]]; then
    echo "❌ ERROR: RPC_URL not found in environment"
    exit 1
fi

# Check for TEE environment and generate keys if needed
if [[ "$TEE_MODE" == "production" || "$PHALA_DEPLOYMENT" == "true" ]]; then
    echo "🔐 TEE Environment Detected"

    # Check if dstack socket exists
    if [[ -S "/var/run/dstack.sock" ]]; then
        echo "✅ dstack TEE socket found: /var/run/dstack.sock"
        export DSTACK_SOCKET_PATH="/var/run/dstack.sock"
    elif [[ -S "/var/run/tappd.sock" ]]; then
        echo "✅ Legacy tappd TEE socket found: /var/run/tappd.sock"
        export DSTACK_SOCKET_PATH="/var/run/tappd.sock"
    else
        echo "⚠️ WARNING: No TEE socket found"
        echo "   Expected: /var/run/dstack.sock (current) or /var/run/tappd.sock (legacy)"
        echo "   TEE features will use simulation mode"
        export TEE_SIMULATION_MODE="true"
    fi

    # Generate private key from TEE if not provided
    if [[ -z "$PRIVATE_KEY" ]]; then
        echo "🔑 Generating private key from TEE..."
        if [[ -n "$DSTACK_SOCKET_PATH" ]]; then
            PRIVATE_KEY=$(echo -n "getKey" | socat - UNIX-CONNECT:"$DSTACK_SOCKET_PATH" 2>/dev/null | tr -d '\n')
            if [[ -n "$PRIVATE_KEY" && ${#PRIVATE_KEY} -eq 64 ]]; then
                echo "✅ Private key generated from TEE"
                export PRIVATE_KEY
            else
                echo "❌ ERROR: Failed to generate private key from TEE"
                echo "   Make sure you're running in a proper TEE environment"
                exit 1
            fi
        else
            echo "❌ ERROR: No TEE socket available for key generation"
            exit 1
        fi
    else
        echo "✅ Using provided private key"
    fi
else
    echo "📁 Local Development Mode"
    # For local development, require PRIVATE_KEY to be set
    if [[ -z "$PRIVATE_KEY" ]]; then
        echo "❌ ERROR: PRIVATE_KEY not found in environment"
        echo "   For local development: Set PRIVATE_KEY in .env file"
        exit 1
    fi
fi

# Check AI API keys availability (informational only)
if [[ -n "$OPENAI_API_KEY" ]]; then
    echo "✅ OpenAI API key available"
    echo "✅ AI provider configured for enhanced analysis"
else
    echo "⚠️  No AI API keys configured - AI features will use fallback analysis"
fi

echo "✅ All required environment variables validated"

# Function to check agent registration status
check_agent_registration() {
    echo "🔍 Checking agent registration status..."

    # Wait for backend services to be ready
    max_attempts=30
    attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf http://localhost:8080/api/agent/info >/dev/null 2>&1; then
            echo "✅ Backend API is ready"

            # Check registration status
            registration_status=$(curl -s http://localhost:8080/api/registration/status 2>/dev/null || echo '{"isRegistered": false}')

            if [[ $(echo "$registration_status" | jq -r '.isRegistered' 2>/dev/null) == "true" ]]; then
                agent_id=$(echo "$registration_status" | jq -r '.agentId' 2>/dev/null)
                echo "✅ Agent already registered with ID: $agent_id"
                return 0
            else
                echo "ℹ️ Agent not registered, attempting registration..."
                return 1
            fi
        fi

        attempt=$((attempt + 1))
        echo "   Waiting for backend services... (attempt $attempt/$max_attempts)"
        sleep 2
    done

    echo "❌ ERROR: Backend services not ready after ${max_attempts} attempts"
    return 1
}

# Function to register agent
register_agent() {
    echo "🔐 Registering agent with ERC-8004 registry..."

    # Attempt registration
    max_attempts=3
    attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        echo "   Attempting registration (attempt $((attempt + 1))/$max_attempts)..."

        # Try to register
        response=$(curl -s -X POST http://localhost:8080/api/register \
            -H "Content-Type: application/json" \
            -d '{"useTEE": true}' 2>/dev/null)

        if [[ $? -eq 0 && $(echo "$response" | jq -r '.success' 2>/dev/null) == "true" ]]; then
            agent_id=$(echo "$response" | jq -r '.agentId' 2>/dev/null)
            echo "✅ Agent registered successfully with ID: $agent_id"
            return 0
        fi

        attempt=$((attempt + 1))

        if [[ $attempt -lt $max_attempts ]]; then
            echo "   Registration failed, retrying in 5 seconds..."
            sleep 5
        fi
    done

    echo "❌ ERROR: Agent registration failed after $max_attempts attempts"
    return 1
}

# TEE Socket Detection (critical for dstack SDK)
if [[ "$TEE_MODE" == "production" || "$PHALA_DEPLOYMENT" == "true" ]]; then
    echo "🔍 Checking TEE socket availability..."
    
    # Check for dstack socket (current) or legacy tappd socket
    if [[ -S "/var/run/dstack.sock" ]]; then
        echo "✅ dstack TEE socket found: /var/run/dstack.sock"
        export DSTACK_SOCKET_PATH="/var/run/dstack.sock"
    elif [[ -S "/var/run/tappd.sock" ]]; then
        echo "✅ Legacy tappd TEE socket found: /var/run/tappd.sock"
        export DSTACK_SOCKET_PATH="/var/run/tappd.sock"
    else
        echo "⚠️ WARNING: No TEE socket found"
        echo "   Expected: /var/run/dstack.sock (current) or /var/run/tappd.sock (legacy)"
        echo "   TEE features will use simulation mode"
        export TEE_SIMULATION_MODE="true"
    fi
fi

# Enhanced process cleanup with better targeting
echo "🧹 Enhanced cleanup..."
pkill -f "python.*808" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "uvicorn.*808" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
sleep 3

# Function to wait for service startup with timeout
wait_for_service() {
    local url=$1
    local name=$2
    local timeout=${3:-30}
    
    echo -n "   ⏳ Waiting for $name..."
    for i in $(seq 1 $timeout); do
        if curl -sf "$url" >/dev/null 2>&1; then
            echo " ✅ Ready!"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo " ❌ Timeout after ${timeout}s"
    return 1
}

# Start Validator Agent with enhanced monitoring
echo "🛡️ Starting Validator Agent..."
python WORKING_VALIDATOR_AGENT.py > logs/validator.log 2>&1 &
VALIDATOR_PID=$!
echo "   Validator PID: $VALIDATOR_PID"

if wait_for_service "http://localhost:8081/health" "Validator Agent" 15; then
    validator_info=$(curl -s http://localhost:8081/health | jq -r '.agent_id // "unknown"' 2>/dev/null || echo "unknown")
    echo "   Agent ID: $validator_info"
else
    echo "❌ Validator Agent startup failed"
    exit 1
fi

# Start A2A API Server with enhanced monitoring
echo "🔮 Starting A2A API Server..."
PYTHONPATH=. python -m agents.a2a_api_server > logs/api.log 2>&1 &
API_PID=$!
echo "   API PID: $API_PID"

if wait_for_service "http://localhost:8080/api/health" "A2A API Server" 20; then
    api_info=$(curl -s http://localhost:8080/api/health | jq -r '.services | keys | join(", ")' 2>/dev/null || echo "unknown")
    echo "   Services: $api_info"
else
    echo "⚠️ A2A API Server startup issues - checking logs..."
    if [[ -f "logs/api.log" ]]; then
        echo "   Recent API logs:"
        tail -8 logs/api.log | sed 's/^/     /'
    fi
    echo "   Continuing with available services (offline mode active)..."
fi

# Start Frontend with enhanced monitoring
echo "🎨 Starting Frontend..."
cd frontend

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo "   📦 Installing frontend dependencies..."
    npm install --silent
fi

npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "   Frontend PID: $FRONTEND_PID"

if wait_for_service "http://localhost:3000" "Frontend Application" 25; then
    frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
    echo "   HTTP Status: $frontend_status"
else
    echo "⚠️ Frontend startup taking longer than expected..."
    echo "   This is normal for Next.js development server"
fi

# Check and handle agent registration
echo
echo "🔐 AGENT REGISTRATION"
echo "===================="

if check_agent_registration; then
    echo "✅ Agent is registered and ready"
else
    echo "🔄 Attempting agent registration..."
    if register_agent; then
        echo "✅ Agent registration completed successfully"
    else
        echo "❌ Agent registration failed"
        echo ""
        echo "🔧 TROUBLESHOOTING:"
        echo "   1. Check if your wallet has sufficient ETH for registration fee (~0.005 ETH)"
        echo "   2. Ensure the ERC-8004 contracts are deployed and accessible"
        echo "   3. Verify RPC_URL is pointing to a working Base Sepolia endpoint"
        echo "   4. Check logs/api.log and logs/validator.log for detailed errors"
        echo ""
        echo "💡 The application will still run, but blockchain features will be limited"
        echo "   until the agent is properly registered."
    fi
fi

echo
echo "🎉 ERC-8004 A2A SYSTEM LAUNCHED!"
echo "==============================="
echo
echo "🌐 Access Your Application:"
echo "   • Main App:     http://localhost:3000"
echo "   • API Server:   http://localhost:8080/docs"
echo "   • Validator:    http://localhost:8081/docs"
echo "   • Debug:        http://localhost:8080/api/debug/replies"
echo
echo "🔥 Features Active:"
echo "   ✅ Real-time AI tracking (Grok→Claude)"
echo "   ✅ Etherscan integration" 
echo "   ✅ Working revenue model"
echo "   ✅ Professional audit downloads"
echo "   ✅ Complete user deployment options"
echo
echo "💰 Revenue Model:"
echo "   • Users pay: ~\$0.60 per audit"
echo "   • You earn: ~\$0.45 per analysis"
echo "   • Traditional cost: \$5,000-\$50,000"
echo "   • Your advantage: 99.99% cost reduction"
echo
echo "Process IDs: API=$API_PID | Validator=$VALIDATOR_PID | Frontend=$FRONTEND_PID"
echo
echo "Press Ctrl+C to stop all services"

# Enhanced monitoring with service recovery
trap 'echo; echo "🛑 Graceful shutdown initiated..."; echo "   Stopping API Server (PID: $API_PID)..."; kill $API_PID 2>/dev/null || true; echo "   Stopping Validator (PID: $VALIDATOR_PID)..."; kill $VALIDATOR_PID 2>/dev/null || true; echo "   Stopping Frontend (PID: $FRONTEND_PID)..."; kill $FRONTEND_PID 2>/dev/null || true; sleep 2; echo "✅ All services stopped gracefully"; exit 0' SIGINT SIGTERM

# Enhanced monitoring loop
monitoring_cycles=0
while true; do
    sleep 30
    monitoring_cycles=$((monitoring_cycles + 1))
    
    # Enhanced health checks with service information
    api_status="❌"
    validator_status="❌"
    frontend_status="❌"
    
    # Check API with service details
    if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
        api_services=$(curl -s http://localhost:8080/api/health 2>/dev/null | jq -r '.services | length' 2>/dev/null || echo "0")
        api_status="✅($api_services)"
    fi
    
    # Check Validator with AI status
    if curl -sf http://localhost:8081/health >/dev/null 2>&1; then
        ai_available=$(curl -s http://localhost:8081/health 2>/dev/null | jq -r '.ai_available // false' 2>/dev/null || echo "false")
        validator_status="✅(AI:$ai_available)"
    fi
    
    # Check Frontend with less aggressive monitoring (every 3rd cycle only)
    if [[ $((monitoring_cycles % 3)) -eq 0 ]]; then
        frontend_code=$(timeout 5s curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
        if [[ "$frontend_code" == "200" ]]; then
            frontend_status="✅(200)"
        elif [[ "$frontend_code" == "500" ]]; then
            frontend_status="⚠️(500)"
        else
            frontend_status="⏳(loading)"
        fi
    else
        frontend_status="⏸️(skip)"
    fi
    
    # Status display with cycle counter
    echo "📊 [$(date +'%H:%M:%S')] Cycle:$monitoring_cycles | API:$api_status | Validator:$validator_status | Frontend:$frontend_status | ERC-8004 A2A Active"
    
    # Auto-restart failed services (production feature)
    if [[ "$api_status" == "❌" ]] && [[ $monitoring_cycles -gt 2 ]]; then
        echo "🔄 Auto-restarting failed API Server..."
        pkill -f "a2a_api_server" 2>/dev/null || true
        sleep 2
        PYTHONPATH=. python -m agents.a2a_api_server > logs/api_restart_$(date +%s).log 2>&1 &
        API_PID=$!
    fi
done
