#!/bin/bash

# 🚀 FINAL ERC-8004 A2A LAUNCHER
# Bulletproof production launcher optimized for Docker and Phala TEE

set -e  # Exit on any error

echo "🚀 FINAL ERC-8004 A2A LAUNCHER"
echo "=============================="
echo "🎯 Starting bulletproof system for production use..."
echo

# Enhanced setup with better error handling
mkdir -p logs data sessions validations 2>/dev/null || true
chmod 755 logs data sessions validations 2>/dev/null || true

# Load .env file if it exists (for local development)
if [[ -f ".env" && -z "$CONTAINER_MODE" ]]; then
    echo "📁 Loading environment from .env file..."
    export $(grep -v '^#' .env | xargs) 2>/dev/null || true
    echo "   Environment variables loaded"
fi

# Validate environment variables are available (no hardcoded keys)
if [[ -z "$PRIVATE_KEY" ]]; then
    echo "❌ ERROR: PRIVATE_KEY not found in environment"
    echo "   For local: Ensure .env file exists with PRIVATE_KEY"
    echo "   For Docker: handled by load_env.sh"
    echo "   For Phala TEE: set via KMS secrets"
    exit 1
fi

# Validate critical environment variables (no fallbacks)
if [[ -z "$RPC_URL" ]]; then
    echo "❌ ERROR: RPC_URL not found in environment"
    exit 1
fi

# Check AI API keys availability (informational only)
ai_providers=0
[[ -n "$GROK_API_KEY" ]] && ai_providers=$((ai_providers + 1)) && echo "✅ Grok API key available"
[[ -n "$OPENAI_API_KEY" ]] && ai_providers=$((ai_providers + 1)) && echo "✅ OpenAI API key available"
[[ -n "$ANTHROPIC_API_KEY" ]] && ai_providers=$((ai_providers + 1)) && echo "✅ Anthropic API key available"

if [[ $ai_providers -eq 0 ]]; then
    echo "⚠️  No AI API keys configured - AI features will use fallback analysis"
else
    echo "✅ $ai_providers AI provider(s) configured for enhanced analysis"
fi

echo "✅ All required environment variables validated"

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
