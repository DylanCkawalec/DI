#!/usr/bin/env python3
"""
Generate a comprehensive contracts report for the ERC-8004 system on Base Sepolia.
- Connects via DRPC (RPC_URL from .env)
- Loads ABIs from contracts/out
- Reads deployed addresses from env or deployed_contracts.json
- Queries key read-only functions to verify live connectivity and data
- Outputs a Markdown report to reports/contracts_report.md and a JSON snapshot to reports/contracts_report.json
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

from dotenv import load_dotenv
from web3 import Web3

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "reports"
CONTRACTS_OUT = ROOT / "contracts" / "out"
DEPLOYED_JSON = ROOT / "deployed_contracts.json"

ABIS = {
    "TEEVerifier": CONTRACTS_OUT / "TEEVerifier.sol" / "TEEVerifier.json",
    "IdentityRegistry": CONTRACTS_OUT / "IdentityRegistry.sol" / "IdentityRegistry.json",
    "ReputationRegistry": CONTRACTS_OUT / "ReputationRegistry.sol" / "ReputationRegistry.json",
    "ValidationRegistry": CONTRACTS_OUT / "ValidationRegistry.sol" / "ValidationRegistry.json",
}


def load_abi(path: Path) -> List[Dict[str, Any]]:
    with path.open() as f:
        data = json.load(f)
    return data.get("abi", [])


def checksum(w3: Web3, addr: str) -> str:
    return Web3.to_checksum_address(addr)


def main() -> int:
    load_dotenv(dotenv_path=ROOT / ".env")

    rpc_url = os.getenv("RPC_URL")
    chain_id = int(os.getenv("CHAIN_ID", "84532"))

    # Load addresses from env with fallback to deployed_contracts.json
    addresses = {
        "TEEVerifier": os.getenv("TEE_VERIFIER_ADDRESS"),
        "IdentityRegistry": os.getenv("IDENTITY_REGISTRY_ADDRESS"),
        "ReputationRegistry": os.getenv("REPUTATION_REGISTRY_ADDRESS"),
        "ValidationRegistry": os.getenv("VALIDATION_REGISTRY_ADDRESS"),
    }

    if DEPLOYED_JSON.exists():
        try:
            deployed = json.loads(DEPLOYED_JSON.read_text())
            c = deployed.get("contracts", {})
            addresses.setdefault("IdentityRegistry", c.get("IdentityRegistry"))
            addresses.setdefault("ReputationRegistry", c.get("ReputationRegistry"))
            addresses.setdefault("ValidationRegistry", c.get("ValidationRegistry"))
        except Exception:
            pass

    # Validate RPC
    if not rpc_url:
        raise SystemExit("RPC_URL not set in environment")

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        raise SystemExit("Failed to connect to RPC")

    # Build contract instances (skip if missing address or ABI)
    contracts: Dict[str, Any] = {}
    for name, abi_path in ABIS.items():
        addr = addresses.get(name)
        if not addr:
            continue
        if not abi_path.exists():
            continue
        try:
            abi = load_abi(abi_path)
            contracts[name] = w3.eth.contract(address=checksum(w3, addr), abi=abi)
        except Exception:
            continue

    # Query data
    snapshot: Dict[str, Any] = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "network": "Base Sepolia",
        "chain_id": chain_id,
        "rpc_url": rpc_url,
        "addresses": addresses,
        "results": {},
    }

    # TEEVerifier
    if "TEEVerifier" in contracts:
        try:
            m = contracts["TEEVerifier"].functions.getTrustedMeasurements().call()
            measurements = [
                {
                    "measurement_hash": (x[0].hex() if hasattr(x[0], "hex") else Web3.to_hex(x[0])),
                    "description": x[1],
                    "added_at": int(x[2]),
                    "active": bool(x[3]),
                }
                for x in m
            ]
            snapshot["results"]["TEEVerifier"] = {
                "trusted_measurements_count": len(measurements),
                "trusted_measurements": measurements[:10],  # limit for report brevity
            }
        except Exception as e:
            snapshot["results"]["TEEVerifier_error"] = str(e)

    # IdentityRegistry (agent count + first few agents)
    if "IdentityRegistry" in contracts:
        try:
            count = 0
            try:
                count = contracts["IdentityRegistry"].functions.getAgentCount().call()
            except Exception:
                # ABI may differ; optional
                count = None
            agents = []
            if count and count > 0:
                for agent_id in range(1, min(count, 5) + 1):
                    try:
                        info = contracts["IdentityRegistry"].functions.getAgent(agent_id).call()
                        agent = {
                            "agent_id": int(info[0]),
                            "domain": info[1],
                            "address": info[2],
                            "measurement_hash": (info[3].hex() if hasattr(info[3], "hex") else Web3.to_hex(info[3])),
                            "domain_verified": bool(info[4]),
                        }
                        agents.append(agent)
                    except Exception:
                        break
            snapshot["results"]["IdentityRegistry"] = {
                "agent_count": count,
                "sample_agents": agents,
            }
        except Exception as e:
            snapshot["results"]["IdentityRegistry_error"] = str(e)

    # ReputationRegistry (sample weight)
    if "ReputationRegistry" in contracts:
        try:
            weight = None
            tee_verified = None
            try:
                res = contracts["ReputationRegistry"].functions.calculateFeedbackWeight(1, 1).call()
                weight = int(res[0])
                tee_verified = bool(res[1])
            except Exception:
                pass
            snapshot["results"]["ReputationRegistry"] = {
                "calculateFeedbackWeight(1,1)": {
                    "weight": weight,
                    "tee_verified": tee_verified,
                }
            }
        except Exception as e:
            snapshot["results"]["ReputationRegistry_error"] = str(e)

    # ValidationRegistry: summarize available view functions by name
    if "ValidationRegistry" in contracts:
        try:
            # Not calling heavy functions; just note presence
            snapshot["results"]["ValidationRegistry"] = {
                "available": True
            }
        except Exception as e:
            snapshot["results"]["ValidationRegistry_error"] = str(e)

    # Ensure reports directory
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Write JSON snapshot
    (OUT_DIR / "contracts_report.json").write_text(json.dumps(snapshot, indent=2))

    # Write Markdown report
    md_lines = []
    md_lines.append("# ERC-8004 Contracts Report (Base Sepolia)")
    md_lines.append("")
    md_lines.append(f"Generated: {snapshot['generated_at']}")
    md_lines.append(f"Chain ID: {snapshot['chain_id']}")
    md_lines.append("")
    md_lines.append("## Addresses")
    for k, v in addresses.items():
        md_lines.append(f"- {k}: {v}")
    md_lines.append("")
    md_lines.append("## TEEVerifier")
    tv = snapshot["results"].get("TEEVerifier")
    if tv:
        md_lines.append(f"- Trusted Measurements: {tv['trusted_measurements_count']}")
        for i, item in enumerate(tv.get("trusted_measurements", []), 1):
            md_lines.append(f"  {i}. {item['description']} ({item['measurement_hash'][:10]}...) active={item['active']}")
    else:
        md_lines.append("- Unavailable or error")
    md_lines.append("")

    md_lines.append("## IdentityRegistry")
    ir = snapshot["results"].get("IdentityRegistry")
    if ir:
        md_lines.append(f"- Agent Count: {ir['agent_count']}")
        for a in ir.get("sample_agents", []):
            md_lines.append(f"  - Agent {a['agent_id']}: {a['domain']} address={a['address']} domainVerified={a['domain_verified']}")
    else:
        md_lines.append("- Unavailable or error")
    md_lines.append("")

    md_lines.append("## ReputationRegistry")
    rr = snapshot["results"].get("ReputationRegistry")
    if rr:
        cfw = rr.get("calculateFeedbackWeight(1,1)")
        if cfw:
            md_lines.append(f"- calculateFeedbackWeight(1,1): weight={cfw['weight']} teeVerified={cfw['tee_verified']}")
    else:
        md_lines.append("- Unavailable or error")
    md_lines.append("")

    md_lines.append("## ValidationRegistry")
    vr = snapshot["results"].get("ValidationRegistry")
    if vr:
        md_lines.append("- Available: True")
    else:
        md_lines.append("- Unavailable or error")
    md_lines.append("")

    (OUT_DIR / "contracts_report.md").write_text("\n".join(md_lines))

    print("✅ Report written to reports/contracts_report.md and reports/contracts_report.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
