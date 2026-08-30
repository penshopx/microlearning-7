#!/usr/bin/env bash
set -euo pipefail

echo "[post-merge] Installing dependencies..."

npm ci --prefer-offline --no-audit --no-fund

echo "[post-merge] Done."
