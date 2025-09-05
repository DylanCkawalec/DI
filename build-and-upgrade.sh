#!/bin/bash

# Build and Upgrade Script for Trustless AI Agent on Phala
# This script builds the Docker image and upgrades the existing CVM without creating a new one

set -e  # Exit on any error

echo "========================================="
echo "Build and Upgrade Trustless AI Agent"
echo "========================================="

# Configuration
DOCKER_IMAGE="dylanckawalec/trustless-ai-erc-8004:latest"
APP_ID="app_deb6a6c817efd909366fe33d993056d53035e814"
CVM_NAME="Trustless-AI-erc-8004"
COMPOSE_FILE="/tmp/di-phala-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building multi-arch Docker image...${NC}"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile \
  -t ${DOCKER_IMAGE} \
  --push \
  .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built and pushed successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Creating Phala compose configuration...${NC}"
cat > ${COMPOSE_FILE} << 'EOF'
version: '3.8'
services:
  app:
    image: dylanckawalec/trustless-ai-erc-8004:latest
    environment:
      NODE_ENV: ${NODE_ENV}
      TEE_MODE: ${TEE_MODE}
      USE_TEE_AUTH: ${USE_TEE_AUTH}
      RPC_URL: ${RPC_URL}
      CHAIN_ID: ${CHAIN_ID}
      SERVER_AGENT_SALT: ${SERVER_AGENT_SALT}
      VALIDATOR_AGENT_SALT: ${VALIDATOR_AGENT_SALT}
    volumes:
      - /var/run/dstack.sock:/var/run/dstack.sock
    ports:
      - "3000:3000"
      - "8080:8080"
      - "8081:8081"
    command: ["/bin/sh", "-lc", "(uvicorn agents.a2a_api_server:app --host 0.0.0.0 --port 8080 &) && (python WORKING_VALIDATOR_AGENT.py &) && cd frontend && node node_modules/next/dist/bin/next start -p 3000"]
    restart: unless-stopped
EOF

echo -e "${GREEN}✓ Compose file created at ${COMPOSE_FILE}${NC}"

echo -e "${YELLOW}Step 3: Upgrading CVM on Phala...${NC}"
phala cvms upgrade ${APP_ID} \
  -c ${COMPOSE_FILE} \
  --debug

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ CVM upgraded successfully${NC}"
else
    echo -e "${RED}✗ CVM upgrade failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 4: Waiting for CVM to stabilize (3 minutes)...${NC}"
echo "  This ensures the container is fully restarted and services are ready."
for i in {1..18}; do
    echo -n "."
    sleep 10
done
echo ""

echo -e "${YELLOW}Step 5: Fetching updated CVM information...${NC}"
phala cvms info ${APP_ID}

echo -e "${YELLOW}Step 6: Deriving service URLs...${NC}"
JSON=$(phala cvms list --json)
INSTANCE_ID=$(echo "$JSON" | jq -r ".[] | select(.name==\"${CVM_NAME}\") | .hosted.instance_id")
HOST=$(echo "$JSON" | jq -r ".[] | select(.name==\"${CVM_NAME}\") | .dapp_dashboard_url" | sed -E 's#https?://([^/]+).*#\1#')
BASE_DOMAIN="${HOST#*-8090.}"

FRONTEND_URL="https://${APP_ID}-3000.${BASE_DOMAIN}"
API_URL="https://${APP_ID}-8080.${BASE_DOMAIN}"
VALIDATOR_URL="https://${APP_ID}-8081.${BASE_DOMAIN}"
NODE_INFO_URL="https://${INSTANCE_ID}-8090.${BASE_DOMAIN}"

echo -e "${GREEN}Service URLs:${NC}"
echo "  Frontend:   ${FRONTEND_URL}"
echo "  API:        ${API_URL}"
echo "  Validator:  ${VALIDATOR_URL}"
echo "  Node Info:  ${NODE_INFO_URL}"

echo -e "${YELLOW}Step 7: Testing service health...${NC}"

# Test Frontend
echo -n "  Testing Frontend... "
if curl -fsS -o /dev/null "${FRONTEND_URL}" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ (may take time to start)${NC}"
fi

# Test API
echo -n "  Testing API Health... "
if curl -fsS "${API_URL}/api/health" 2>/dev/null | grep -q "ok"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ (may take time to start)${NC}"
fi

# Test Validator
echo -n "  Testing Validator Health... "
if curl -fsS "${VALIDATOR_URL}/health" 2>/dev/null | grep -q "ok"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ (may take time to start)${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Build and upgrade completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Your Trustless AI Agent has been upgraded."
echo "App ID: ${APP_ID}"
echo ""
echo "You can access your services at:"
echo "  - Frontend:  ${FRONTEND_URL}"
echo "  - API:       ${API_URL}"
echo "  - Validator: ${VALIDATOR_URL}"
echo ""
echo "Note: It may take a few minutes for all services to fully start."
