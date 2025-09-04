# ERC-8004 AI Code Review Agents - Phala TEE Docker Image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY agents/ ./agents/
COPY scripts/ ./scripts/
COPY contracts/out/ ./contracts/out/
COPY *.py ./
COPY *.json ./

# Create data directories
RUN mkdir -p data validations logs

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Create non-root user (will be overridden to root in docker-compose for TEE access)
RUN useradd -m -s /bin/bash erc8004
RUN chown -R erc8004:erc8004 /app
USER erc8004

# Expose ports
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/agent/info || exit 1

# Default command (will be overridden by docker-compose)
CMD ["python", "-m", "agents.code_review_server_agent"]
