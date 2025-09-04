# 🚀 ERC-8004 Trustless AI - Phala Cloud TEE Dockerfile
# ======================================================
# Multi-platform build for Phala Cloud TEE deployment
# Supports: linux/amd64, linux/arm64

# Multi-stage build: Frontend compilation
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN apk add --no-cache python3 make g++ && npm ci --omit=dev
COPY frontend/ ./
RUN npm run build

# Production image optimized for Phala Cloud TEE
FROM --platform=$TARGETPLATFORM python:3.11-slim AS production

# Install system dependencies
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

# Install Node.js 22 for Next.js production
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && node --version \
    && npm --version

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install production packages
RUN pip install --no-cache-dir gunicorn uvloop httptools

# Copy application code
COPY agents/ ./agents/
COPY contracts/out/ ./contracts/out/
COPY *.py ./
COPY *.json ./
COPY *.csv ./
COPY ERC8004-spec.md ./
COPY README.md ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY frontend/next.config.js ./frontend/

# Install frontend production dependencies
WORKDIR /app/frontend
RUN npm ci --omit=dev
WORKDIR /app

# Copy launcher script and environment handling
COPY quick_launch.sh ./
RUN chmod +x quick_launch.sh

# Copy environment file securely (will be overridden by deployment)
COPY .env* ./
RUN chmod 600 .env* 2>/dev/null || true

# Create secure environment loader script
RUN echo '#!/bin/bash' > /app/load_env.sh && \
    echo 'set -a' >> /app/load_env.sh && \
    echo '[ -f /app/.env ] && source /app/.env' >> /app/load_env.sh && \
    echo 'set +a' >> /app/load_env.sh && \
    echo 'exec "$@"' >> /app/load_env.sh && \
    chmod +x /app/load_env.sh

# Create required directories
RUN mkdir -p data validations logs sessions

# Set environment variables for Phala TEE
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV TEE_MODE=production
ENV PHALA_DEPLOYMENT=true
ENV CONTAINER_MODE=true
ENV GRANT_SUDO=yes
ENV HEALTHCHECK_INTERVAL=30000

# Create production user
RUN groupadd -r erc8004 && useradd -r -g erc8004 erc8004
RUN chown -R erc8004:erc8004 /app

# Expose application ports for Phala Cloud
EXPOSE 3000 8080 8081 8000

# Phala Cloud compatible health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Run as root for Phala Cloud TEE access (standard for TEE)
USER root

# Default command with environment loading for Phala deployment  
CMD ["./load_env.sh", "./quick_launch.sh"]
