# 🚀 ERC-8004 Trustless AI - Production Dockerfile for Phala TEE
# =============================================================
# Bulletproof multi-platform build optimized for reliability

# Frontend build stage
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first (better caching)
COPY frontend/package*.json ./

# Install dependencies with build tools
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev

# Copy frontend source
COPY frontend/ ./

# Ensure public directory exists
RUN mkdir -p public

# Build frontend
RUN npm run build

# Production stage
FROM --platform=$TARGETPLATFORM python:3.11-slim AS production

# Install system dependencies in single layer
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for production
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && node --version \
    && npm --version

# Set working directory
WORKDIR /app

# Copy and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn uvloop httptools

# Copy application code
COPY agents/ ./agents/
COPY contracts/out/ ./contracts/out/
COPY WORKING_VALIDATOR_AGENT.py ./
COPY deployed_contracts.json ./
COPY base_contract_example.csv ./

# Copy essential documentation
COPY ERC8004-spec.md README.md ./

# Copy frontend build artifacts
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY frontend/next.config.js ./frontend/

# Install frontend production dependencies
WORKDIR /app/frontend
RUN npm ci --omit=dev
WORKDIR /app

# Copy startup scripts
COPY quick_launch.sh ./
RUN chmod +x quick_launch.sh

# Create secure environment loader
RUN echo '#!/bin/bash' > load_env.sh \
    && echo 'set -a' >> load_env.sh \
    && echo '[ -f /app/.env ] && source /app/.env' >> load_env.sh \
    && echo 'set +a' >> load_env.sh \
    && echo 'exec "$@"' >> load_env.sh \
    && chmod +x load_env.sh

# Create data directories
RUN mkdir -p data logs sessions validations \
    && chmod 755 data logs sessions validations

# Set environment for Phala TEE
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV TEE_MODE=production
ENV PHALA_DEPLOYMENT=true
ENV CONTAINER_MODE=true
ENV GRANT_SUDO=yes

# Create user and set permissions
RUN groupadd -r erc8004 && useradd -r -g erc8004 erc8004 \
    && chown -R erc8004:erc8004 /app

# Expose ports
EXPOSE 3000 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Run as root for TEE (Phala requirement)
USER root

# Startup command
CMD ["./load_env.sh", "./quick_launch.sh"]