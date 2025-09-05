#!/bin/bash

# 🚀 ERC-8004 Enhanced AI Production Build & Deploy Script
# =========================================================
# Complete build → Docker → Phala TEE deployment sequence

set -e  # Exit on any error

echo "🚀 ERC-8004 Enhanced AI Production Build & Deploy"
echo "=================================================="
echo "🎯 Building sophisticated AI system for Phala TEE deployment"
echo

# Step 1: Pre-build verification
echo "🔍 Step 1: Pre-build verification..."
if [[ ! -f ".env" ]]; then
    echo "❌ ERROR: .env file not found"
    echo "   Create .env with all required API keys and configuration"
    exit 1
fi

# Check for enhanced AI system
if [[ ! -f "expert_prompt_system.py" ]]; then
    echo "❌ ERROR: expert_prompt_system.py not found"
    echo "   Enhanced AI system required for production"
    exit 1
fi

# Check enhanced agent
if [[ ! -f "agents/enhanced_code_review_agent.py" ]]; then
    echo "❌ ERROR: enhanced_code_review_agent.py not found"
    echo "   Enhanced agent required for production"
    exit 1
fi

echo "✅ Pre-build verification passed"

# Step 2: Multi-arch Docker build and push
echo -e "\n🐳 Step 2: Multi-arch Docker build..."

# Build multi-architecture image for ARM64 (Apple Silicon) and AMD64 (Intel/Phala)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t dylanckawalec/erc8004-enhanced-ai:latest \
  -t dylanckawalec/erc8004-enhanced-ai:v2.0.0 \
  --push \
  .

echo "✅ Multi-arch Docker image built and pushed"

# Step 3: Create Phala TEE runtime compose
echo -e "\n🔮 Step 3: Creating Phala TEE runtime compose..."

cat > /tmp/erc8004-phala-compose.yml << 'EOF'
# ERC-8004 Enhanced AI - Phala TEE Runtime Compose
# ================================================
# Production runtime for Phala Cloud deployment
# Uses enhanced AI system with Grok + Claude models

version: '3.8'

services:
  erc8004-enhanced-ai:
    image: dylanckawalec/erc8004-enhanced-ai:latest
    container_name: erc8004-enhanced-ai
    
    # Phala TEE specific environment
    environment:
      # Core application settings
      - NODE_ENV=production
      - TEE_MODE=production
      - PHALA_DEPLOYMENT=true
      - CONTAINER_MODE=true
      - GRANT_SUDO=yes
      
      # Enhanced AI configuration
      - GROK_FAST_MODEL=grok-3-mini
      - GROK_STANDARD_MODEL=grok-3
      - CLAUDE_MODEL=claude-3-5-sonnet-20241022
      
      # Blockchain configuration (passed via KMS)
      - CHAIN_ID=84532
      
    # Port mapping for Phala Cloud
    ports:
      - "3000:3000"    # Frontend
      - "8080:8080"    # Enhanced A2A API
      - "8081:8081"    # Validator Agent
    
    # Phala TEE volume mounts
    volumes:
      - /var/run/dstack.sock:/var/run/dstack.sock
      - /var/run/tappd.sock:/var/run/tappd.sock
    
    # Resource optimization for TEE
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'
    
    # Enhanced health check (backend only)
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 60s
      timeout: 10s
      retries: 3
      start_period: 60s
    
    restart: unless-stopped

networks:
  default:
    driver: bridge
EOF

echo "✅ Phala TEE runtime compose created: /tmp/erc8004-phala-compose.yml"

# Step 4: Enhanced Phala deployment YAML
echo -e "\n☁️  Step 4: Updating Phala deployment configuration..."

cat > /tmp/erc8004-phala-deployment.yml << 'EOF'
# ERC-8004 Enhanced AI - Phala Cloud Deployment
# =============================================
# Production Kubernetes deployment with enhanced AI system

apiVersion: apps/v1
kind: Deployment
metadata:
  name: erc8004-enhanced-ai
  labels:
    app: erc8004-enhanced
    version: v2.0.0
    ai-system: enhanced
spec:
  replicas: 1
  selector:
    matchLabels:
      app: erc8004-enhanced
  template:
    metadata:
      labels:
        app: erc8004-enhanced
        tee-enabled: "true"
        ai-enhanced: "true"
    spec:
      containers:
      - name: erc8004-enhanced-ai
        image: dylanckawalec/erc8004-enhanced-ai:latest
        ports:
        - containerPort: 3000
          name: frontend
        - containerPort: 8080
          name: api-server
        - containerPort: 8081
          name: validator
        
        env:
        # TEE Configuration
        - name: TEE_MODE
          value: "production"
        - name: PHALA_DEPLOYMENT
          value: "true"
        
        # Enhanced AI Models
        - name: GROK_FAST_MODEL
          value: "grok-3-mini"
        - name: GROK_STANDARD_MODEL
          value: "grok-3"
        - name: CLAUDE_MODEL
          value: "claude-3-5-sonnet-20241022"
        
        # All secrets managed via KMS
        # (PRIVATE_KEY, API keys, etc. injected via Phala KMS)
        
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        
        # Enhanced health check (backend only)
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 60
        
        readinessProbe:
          httpGet:
            path: /health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: erc8004-enhanced-service
  labels:
    app: erc8004-enhanced
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    name: frontend
  - port: 8080
    targetPort: 8080
    name: api-server
  - port: 8081
    targetPort: 8081
    name: validator
  selector:
    app: erc8004-enhanced
EOF

echo "✅ Enhanced Phala deployment YAML created: /tmp/erc8004-phala-deployment.yml"

# Step 5: Deployment commands
echo -e "\n📝 Step 5: Production Deployment Commands"
echo "=========================================="
echo
echo "🐳 Docker Commands:"
echo "# 1. Build and push (already done above)"
echo "docker buildx build --platform linux/amd64,linux/arm64 -t dylanckawalec/erc8004-enhanced-ai:latest --push ."
echo
echo "☁️  Phala Cloud Commands:"
echo "# 2. Deploy to Phala TEE"
echo "phala deploy -f /tmp/erc8004-phala-compose.yml --node-id 12 --image dstack-0.5.3 --kms kms_vY6W52yL"
echo
echo "# 3. Upgrade existing deployment"
echo "phala cvms upgrade <APP_ID> -f /tmp/erc8004-phala-compose.yml"
echo
echo "# 4. Health check commands"
echo "curl -f https://<app-id>.apps.phala.network/api/health"
echo "curl -f https://<app-id>.apps.phala.network:8080/api/health"
echo "curl -f https://<app-id>.apps.phala.network:8081/health"
echo

# Step 6: System summary
echo "🎉 Enhanced ERC-8004 AI System Ready for Production!"
echo "==================================================="
echo "✅ Sophisticated AI Integration:"
echo "   • Grok 3-Mini for rapid security scanning"
echo "   • Grok 3 for code improvement & performance"
echo "   • Claude 3.5 Sonnet for deep security analysis"
echo "   • 6-phase expert analysis workflow"
echo "   • CVSS 3.1 vulnerability scoring"
echo "   • Production-ready improved code generation"
echo
echo "✅ A2A Protocol Features:"
echo "   • Enhanced agent-to-agent communication"
echo "   • Encrypted payload system"
echo "   • Blockchain verification on Base Sepolia"
echo "   • Professional audit trails"
echo
echo "✅ Production Ready:"
echo "   • Multi-arch Docker support (ARM64/AMD64)"
echo "   • Phala TEE integration"
echo "   • KMS secret management"
echo "   • Enhanced health monitoring"
echo "   • Revenue model: ~$0.16 per comprehensive analysis"
echo
echo "🎯 Next: Use the Phala commands above to deploy!"
