#!/usr/bin/env python3
"""
Local Anvil helper for Foundry deploy and sanity checks.

- Loads .env (RPC_URL, PRIVATE_KEY, CHAIN_ID)
- Starts Anvil if RPC is unreachable
- Runs forge script to deploy (contracts/script/Deploy.s.sol)
- Parses broadcast to capture deployed addresses
- Updates .env with addresses
- Performs a minimal sanity check via web3.py

Usage:
  python scripts/test_local_anvil.py               # start local anvil if needed, deploy, verify
  python scripts/test_local_anvil.py --keep-anvil  # leave anvil running
  python scripts/test_local_anvil.py --force-deploy# force re-deploy
  python scripts/test_local_anvil.py --use-env-rpc # use RPC_URL from .env (careful: may be a remote network)
"""
from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

from dotenv import load_dotenv
from web3 import Web3

ROOT = Path(__file__).resolve().parent.parent
CONTRACTS_DIR = ROOT / "contracts"
BROADCAST_DIR = CONTRACTS_DIR / "broadcast" / "Deploy.s.sol"
OUT_DIR = CONTRACTS_DIR / "out"
ENV_PATH = ROOT / ".env"

DEFAULT_RPC = "http://127.0.0.1:8545"
DEFAULT_CHAIN_ID = 31337
# Foundry Anvil default dev key (#0); used only if .env lacks PRIVATE_KEY
DEFAULT_LOCAL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


def wait_for_http_provider(url: str, timeout: float = 15.0) -> bool:
    start = time.time()
    while time.time() - start < timeout:
        try:
            w3 = Web3(Web3.HTTPProvider(url))
            if w3.is_connected():
                return True
        except Exception:
            pass
        time.sleep(0.25)
    return False


def parse_rpc_host_port(url: str) -> Tuple[str, int]:
    parsed = urlparse(url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 8545
    return host, int(port)


def start_anvil_if_needed(rpc_url: str, chain_id: int) -> Optional[subprocess.Popen]:
    if wait_for_http_provider(rpc_url, timeout=0.75):
        print(f"RPC reachable: {rpc_url}")
        return None

    host, port = parse_rpc_host_port(rpc_url)
    print(f"Starting Anvil on {host}:{port} (chain_id={chain_id})...")
    cmd = [
        "anvil",
        "--host",
        host,
        "--port",
        str(port),
        "--chain-id",
        str(chain_id),
        "--silent",
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if not wait_for_http_provider(rpc_url, timeout=10.0):
        # Surface some logs to help debug
        try:
            out = proc.stdout.read(500).decode("utf-8", errors="ignore") if proc.stdout else ""
        except Exception:
            out = ""
        proc.kill()
        raise RuntimeError(f"Failed to start Anvil on {host}:{port}. Partial output:\n{out}")
    print("Anvil started.")
    return proc


def run_forge_deploy(rpc_url: str, env: Dict[str, str]) -> None:
    print("Building contracts (forge build)...")
    res_build = subprocess.run([
        "forge", "build"
    ], cwd=str(CONTRACTS_DIR), env=env, capture_output=True, text=True)
    if res_build.returncode != 0:
        eprint(res_build.stdout)
        eprint(res_build.stderr)
        raise RuntimeError("forge build failed")

    print("Deploying via foundry (forge script ... --broadcast)...")
    cmd = [
        "forge", "script", "script/Deploy.s.sol:Deploy",
        "--rpc-url", rpc_url,
        "--broadcast",
    ]
    res = subprocess.run(cmd, cwd=str(CONTRACTS_DIR), env=env, capture_output=True, text=True)
    if res.returncode != 0:
        eprint(res.stdout)
        eprint(res.stderr)
        raise RuntimeError("forge script deploy failed")


def find_broadcast_run(chain_id: int) -> Path:
    cid_dir = BROADCAST_DIR / str(chain_id)
    run_latest = cid_dir / "run-latest.json"
    if run_latest.exists():
        return run_latest
    # Fallback: pick the newest run-*.json
    if cid_dir.exists():
        runs = sorted(cid_dir.glob("run-*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        if runs:
            return runs[0]
    raise FileNotFoundError(f"No broadcast run file found for chain {chain_id} in {cid_dir}")


def parse_deployed_addresses(run_json_path: Path) -> Dict[str, str]:
    data = json.loads(run_json_path.read_text())
    addresses: Dict[str, str] = {}

    txs = data.get("transactions") or []
    for tx in txs:
        name = tx.get("contractName")
        addr = tx.get("contractAddress")
        if name and addr:
            addresses[name] = addr

    mapping = {}
    for key, addr in addresses.items():
        if key.endswith("IdentityRegistry") or key == "IdentityRegistry":
            mapping["IDENTITY_REGISTRY_ADDRESS"] = addr
        elif key.endswith("ReputationRegistry") or key == "ReputationRegistry":
            mapping["REPUTATION_REGISTRY_ADDRESS"] = addr
        elif key.endswith("ValidationRegistry") or key == "ValidationRegistry":
            mapping["VALIDATION_REGISTRY_ADDRESS"] = addr

    if not mapping:
        raise RuntimeError(f"Could not find deployed contract addresses in {run_json_path}")

    return mapping


def upsert_env_vars(env_path: Path, updates: Dict[str, str]) -> None:
    env_text = env_path.read_text() if env_path.exists() else ""
    lines = env_text.splitlines()
    seen = {k: False for k in updates}

    for i, line in enumerate(lines):
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        k, _ = line.split("=", 1)
        k = k.strip()
        if k in updates:
            lines[i] = f"{k}={updates[k]}"
            seen[k] = True

    for k, v in updates.items():
        if not seen[k]:
            lines.append(f"{k}={v}")

    env_path.write_text("\n".join(lines) + "\n")


def load_contract_abi(name: str):
    p = OUT_DIR / f"{name}.sol" / f"{name}.json"
    if not p.exists():
        raise FileNotFoundError(f"Missing ABI at {p}; did forge build run?")
    return json.loads(p.read_text()).get("abi")


def sanity_check(rpc_url: str, addresses: Dict[str, str]) -> None:
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    assert w3.is_connected(), f"Cannot connect to {rpc_url}"

    idr_addr = Web3.to_checksum_address(addresses["IDENTITY_REGISTRY_ADDRESS"])
    vdr_addr = Web3.to_checksum_address(addresses["VALIDATION_REGISTRY_ADDRESS"])

    idr = w3.eth.contract(address=idr_addr, abi=load_contract_abi("IdentityRegistry"))
    vdr = w3.eth.contract(address=vdr_addr, abi=load_contract_abi("ValidationRegistry"))

    fee = idr.functions.REGISTRATION_FEE().call()
    slots = vdr.functions.getExpirationSlots().call()
    print(f"Sanity: REGISTRATION_FEE={fee} wei, EXPIRATION_SLOTS={slots}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--keep-anvil", action="store_true", help="Do not kill anvil on exit")
    parser.add_argument("--force-deploy", action="store_true", help="Force re-deploy even if broadcast exists")
    parser.add_argument("--use-env-rpc", action="store_true", help="Use RPC_URL from .env (default: use local Anvil at 127.0.0.1:8545)")
    args = parser.parse_args()

    if not ENV_PATH.exists():
        eprint(".env not found; copying from .env.example ...")
        example = ROOT / ".env.example"
        if not example.exists():
            eprint(".env.example missing; aborting")
            return 1
        ENV_PATH.write_text(example.read_text())

    load_dotenv(dotenv_path=ENV_PATH)

    # Prefer local Anvil unless user opts in to the .env RPC explicitly
    if args.use_env_rpc:
        rpc_url = os.getenv("RPC_URL", DEFAULT_RPC)
    else:
        rpc_url = DEFAULT_RPC

    chain_id = int(os.getenv("CHAIN_ID", str(DEFAULT_CHAIN_ID)))
    private_key = os.getenv("PRIVATE_KEY") or DEFAULT_LOCAL_KEY
    # Normalize private key for Foundry (expects 0x-prefixed hex for vm.envUint)
    if not private_key.startswith("0x") and len(private_key) == 64:
        private_key = "0x" + private_key

    env_for_child = os.environ.copy()
    env_for_child["PRIVATE_KEY"] = private_key

    anvil_proc: Optional[subprocess.Popen] = None
    try:
        anvil_proc = start_anvil_if_needed(rpc_url, chain_id)

        need_deploy = args.force_deploy
        if not need_deploy:
            try:
                run_path = find_broadcast_run(chain_id)
                print(f"Found existing broadcast: {run_path}")
            except FileNotFoundError:
                need_deploy = True

        if need_deploy:
            run_forge_deploy(rpc_url, env_for_child)

        run_path = find_broadcast_run(chain_id)
        addresses = parse_deployed_addresses(run_path)
        print("Deployed addresses:")
        for k, v in addresses.items():
            print(f"  {k} = {v}")

        upsert_env_vars(ENV_PATH, addresses)
        print("Updated .env with deployed addresses.")

        sanity_check(rpc_url, addresses)
        print("✅ Local Anvil + Foundry deploy looks good.")
        return 0
    finally:
        if anvil_proc and not args.keep_anvil:
            try:
                anvil_proc.send_signal(signal.SIGINT)
                anvil_proc.wait(timeout=3)
            except Exception:
                anvil_proc.kill()


if __name__ == "__main__":
    sys.exit(main())
