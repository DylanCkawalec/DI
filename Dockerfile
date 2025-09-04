# 🚀 ERC-8004 Trustless AI - Final Production Dockerfile
# ====================================================
# Complete A2A protocol deployment for Phala Cloud TEE

# Multi-stage build: Frontend compilation
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN apk add --no-cache python3 make g++ && npm ci --omit=dev
COPY frontend/ ./
RUN npm run build

# Production image with Python + Node.js + Phala TEE support
FROM python:3.11-slim AS production

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

# Copy launcher script
COPY quick_launch.sh ./
RUN chmod +x quick_launch.sh

# Create required directories
RUN mkdir -p data validations logs sessions

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV TEE_MODE=production
ENV PHALA_DEPLOYMENT=true

# Create production user
RUN groupadd -r erc8004 && useradd -r -g erc8004 erc8004
RUN chown -R erc8004:erc8004 /app

# Expose application ports
EXPOSE 3000 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health && \
        curl -f http://localhost:8081/health && \
        curl -f http://localhost:3000 || exit 1

# Run as production user (Phala TEE will override if needed)
USER erc8004

# Default command
CMD ["./quick_launch.sh"]
