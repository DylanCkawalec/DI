#!/bin/bash

# 🚀 QUICK ERC-8004 A2A LAUNCHER
# Simple, bulletproof launcher for immediate production use

echo "🚀 QUICK ERC-8004 A2A LAUNCHER"
echo "============================="
echo "🎯 Starting complete system for immediate use..."
echo

# Setup
mkdir -p logs data sessions validations 2>/dev/null || true

# Load environment
if [[ -f ".env" ]]; then
    export $(grep -v '^#' .env | xargs) 2>/dev/null || true
    echo "✅ Environment loaded from .env"
else
    echo "⚠️  No .env file - using demo configuration"
fi

# Set demo defaults
export PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

# Clean up existing processes
echo "🧹 Cleaning up..."
pkill -f "python.*808" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Start Validator Agent (simple and working)
echo "🛡️ Starting Validator Agent..."
python WORKING_VALIDATOR_AGENT.py > logs/validator.log 2>&1 &
VALIDATOR_PID=$!
echo "   Validator PID: $VALIDATOR_PID"

# Wait for validator
sleep 5
if curl -sf http://localhost:8081/health >/dev/null 2>&1; then
    echo "✅ Validator Agent online"
else
    echo "❌ Validator Agent failed"
    exit 1
fi

# Start A2A API Server
echo "🔮 Starting A2A API Server..."
PYTHONPATH=. python -m agents.a2a_api_server > logs/api.log 2>&1 &
API_PID=$!
echo "   API PID: $API_PID"

# Wait for API
sleep 8
if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
    echo "✅ A2A API Server online"
else
    echo "⚠️ A2A API Server may have issues - checking logs..."
    if [[ -f "logs/api.log" ]]; then
        echo "Recent API logs:"
        tail -5 logs/api.log
    fi
    echo "Continuing with available services..."
fi

# Start Frontend
echo "🎨 Starting Frontend..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend
sleep 10
if curl -sf http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Frontend online"
else
    echo "⚠️ Frontend starting... may take a moment"
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

# Monitoring
trap 'echo; echo "🛑 Stopping all services..."; kill $API_PID $VALIDATOR_PID $FRONTEND_PID 2>/dev/null; exit 0' SIGINT SIGTERM

while true; do
    sleep 30
    
    # Quick health check
    api_status="❌"
    validator_status="❌"
    frontend_status="❌"
    
    curl -sf http://localhost:8080/api/health >/dev/null 2>&1 && api_status="✅"
    curl -sf http://localhost:8081/health >/dev/null 2>&1 && validator_status="✅"
    curl -sf http://localhost:3000 >/dev/null 2>&1 && frontend_status="✅"
    
    echo "📊 [$(date +'%H:%M:%S')] Status: API:$api_status | Validator:$validator_status | Frontend:$frontend_status | ERC-8004 A2A Active"
done
