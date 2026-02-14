# ERC-8004 TEE Agent **ARCHIVED**

> This repository is not longer in sync with the latest efforts in ERC-8004. If you are looking for the latest, check out https://github.com/Phala-Network/erc-8004-tee-agent. if you are wanting more support for real TEE deployments utilizing ERC-8004 please reach out to the dAI team as they have an opinion on TEEs that may not align with the work done in this working solution that has real TEE validation end to end. I will no longer maintain any work around ERC-8004 individually, but I will publish updates to the mentioned repo above if requested through Phala. Thank you.


Trustless AI agents with Intel TDX attestation on Base Sepolia.

## Features

- 🔐 TEE-derived keys (Intel TDX via Phala dstack)
- 🌐 ERC-8004 registration-v1 compliant (`/agent.json`)
- 📜 Real TEE attestation
- 🔗 On-chain registration (0.0001 ETH)
- 🤖 A2A protocol support
- 🔧 Config-driven endpoint management

## Quick Start

```bash
git clone https://github.com/HashWarlock/erc-8004-ex-phala.git
cd erc-8004-ex-phala
cp .env.example .env
# Edit .env and agent_config.json
docker compose up -d
```

Open http://localhost:8000

## Project Structure

```
erc-8004-ex-phala/
├── agent_config.json          # Agent metadata & endpoints
├── entrypoint.sh              # Docker entrypoint
├── docker-compose.yml         # Deployment config
├── contracts/                 # Solidity contracts
├── src/agent/                 # Core logic
│   ├── tee_auth.py           # TEE key derivation
│   ├── tee_verifier.py       # TEE registration
│   ├── agent_card.py         # ERC-8004 builders
│   └── registry.py           # On-chain client
├── deployment/
│   └── local_agent_server.py # FastAPI server
└── static/                    # Web UI
```

## Architecture

```
┌─────────────┐
│   Wallet    │ Fund with Base Sepolia ETH
└─────────────┘
       ↓
┌─────────────┐
│  Register   │ Identity Registry (on-chain)
└─────────────┘
       ↓
┌─────────────┐
│ TEE Verify  │ Attestation + Code Measurement
└─────────────┘
       ↓
┌─────────────┐
│    Ready    │ A2A endpoints active
└─────────────┘
```

## API Endpoints

- `GET /agent.json` - ERC-8004 registration-v1 format
- `GET /.well-known/agent-card.json` - A2A agent card
- `GET /api/status` - Agent status
- `POST /api/register` - Register on-chain
- `POST /api/tee/register` - Register TEE key
- `POST /api/metadata/update` - Update on-chain metadata
- `POST /tasks` - A2A task submission
- `GET /tasks/{id}` - Task status

## Deployed Contracts

**Base Sepolia:**
- IdentityRegistry: `0x8506e13d47faa2DC8c5a0dD49182e74A6131a0e3` (0.0001 ETH fee)
- TEERegistry: `0x03eCA4d903Adc96440328C2E3a18B71EB0AFa60D`
- Verifier: `0x481ce1a6EEC3016d1E61725B1527D73Df1c393a5`

## Configuration

**`.env`** - Runtime config:
```bash
AGENT_DOMAIN=your-domain.com
AGENT_SALT=unique-salt
IDENTITY_REGISTRY_ADDRESS=0x8506e13d47faa2DC8c5a0dD49182e74A6131a0e3
TEE_REGISTRY_ADDRESS=0x03eCA4d903Adc96440328C2E3a18B71EB0AFa60D
```

**`agent_config.json`** - Agent metadata:
```json
{
  "name": "Your Agent",
  "description": "Agent description",
  "endpoints": {
    "a2a": {"enabled": true},
    "mcp": {"enabled": false, "endpoint": ""},
    "ens": {"enabled": false, "endpoint": ""}
  },
  "evmChains": [
    {"name": "Base", "chainId": 8453}
  ],
  "supportedTrust": ["tee-attestation"]
}
```

## Customization

Edit `agent_config.json` to add endpoints:

**Add MCP:**
```json
"mcp": {
  "enabled": true,
  "endpoint": "https://mcp.agent.eth/",
  "version": "2025-06-18"
}
```

**Add chains:**
```json
{"name": "Polygon", "chainId": 137}
```

**Add trust models:**
```json
"supportedTrust": ["tee-attestation", "reputation"]
```

## How It Works

1. TEE derives keys from `domain+salt`
2. Fund wallet (0.0001 ETH)
3. Register on-chain
4. Submit TEE attestation
5. Agent live at `/agent.json`

## Tech Stack

- Intel TDX (Phala dstack)
- Base Sepolia
- Python/FastAPI
- Solidity ^0.8.20

## ERC-8004 Compliance

✅ `/agent.json` (registration-v1)
✅ CAIP-10 wallet addresses
✅ A2A endpoints
✅ TEE attestation
✅ On-chain registry

## License

MIT

## Links

- **Spec**: [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
- **Reference**: [dstack-erc8004-poc](https://github.com/h4x3rotab/dstack-erc8004-poc)
- **Phala**: [phala.network](https://phala.network)
- **Base**: [base.org](https://base.org)
