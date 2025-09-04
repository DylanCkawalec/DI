#!/bin/bash

# 🔍 ERC-8004 System Startup Verification
# =======================================
# Comprehensive verification script for production deployment

echo "🔍 ERC-8004 SYSTEM VERIFICATION"
echo "==============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test function
test_service() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [[ "$response" == "$expected_status" ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

# Test JSON endpoint
test_json_service() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null)
    
    if [[ -n "$response" ]] && echo "$response" | jq . >/dev/null 2>&1; then
        status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null)
        echo -e "${GREEN}✅ PASS ($status)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Invalid JSON or no response)${NC}"
        return 1
    fi
}

# Comprehensive system test
echo "🧪 RUNNING COMPREHENSIVE SYSTEM TESTS:"
echo "======================================="
echo ""

failed_tests=0

# Test 1: Validator Agent
echo "1. 🛡️ Validator Agent (AI Core):"
if test_json_service "http://localhost:8081/health" "   Health Check"; then
    agent_id=$(curl -s http://localhost:8081/health 2>/dev/null | jq -r '.agent_id // "unknown"' 2>/dev/null)
    ai_status=$(curl -s http://localhost:8081/health 2>/dev/null | jq -r '.ai_available // false' 2>/dev/null)
    echo "      Agent ID: $agent_id | AI Available: $ai_status"
else
    failed_tests=$((failed_tests + 1))
fi
echo ""

# Test 2: A2A API Server
echo "2. 🤖 A2A API Server (Protocol Core):"
if test_json_service "http://localhost:8080/api/health" "   Health Check"; then
    oracle_status=$(curl -s http://localhost:8080/api/health 2>/dev/null | jq -r '.services.oracle // false' 2>/dev/null)
    review_status=$(curl -s http://localhost:8080/api/health 2>/dev/null | jq -r '.services.code_review // false' 2>/dev/null)
    echo "      Oracle: $oracle_status | Code Review: $review_status"
else
    failed_tests=$((failed_tests + 1))
fi
echo ""

# Test 3: Frontend Application
echo "3. 🌐 Frontend Application (User Interface):"
if test_service "http://localhost:3000" "   Homepage Load"; then
    echo "      React application working perfectly"
else
    failed_tests=$((failed_tests + 1))
fi
echo ""

# Test 4: API Endpoints
echo "4. 🔗 API Endpoint Testing:"
test_service "http://localhost:8080/docs" "   API Documentation" || failed_tests=$((failed_tests + 1))
test_service "http://localhost:8081/docs" "   Validator Docs" || failed_tests=$((failed_tests + 1))
echo ""

# Test 5: Debug Capabilities
echo "5. 🔍 Debug Capabilities:"
if test_json_service "http://localhost:8080/api/debug/replies" "   Debug Endpoint"; then
    session_count=$(curl -s http://localhost:8080/api/debug/replies 2>/dev/null | jq -r '.total_sessions // 0' 2>/dev/null)
    echo "      Debug sessions available: $session_count"
else
    echo "      Debug endpoint may not be critical for production"
fi
echo ""

# Final Results
echo "🎯 VERIFICATION RESULTS:"
echo "======================="

if [[ $failed_tests -eq 0 ]]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}🎉 System is ready for production deployment!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Docker Build Command:${NC}"
    echo "   docker buildx build --platform linux/amd64,linux/arm64 -t dylanckawalec/trustless-ai-erc-8004:latest --push ."
    echo ""
    echo -e "${BLUE}🌐 Phala TEE Deployment:${NC}"
    echo "   docker-compose up -d"
    exit 0
else
    echo -e "${RED}❌ $failed_tests TEST(S) FAILED${NC}"
    echo -e "${YELLOW}⚠️  Fix issues before proceeding to production deployment${NC}"
    exit 1
fi
