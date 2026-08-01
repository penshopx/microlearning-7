#!/bin/bash
set -e

echo "[post-merge] Installing dependencies..."
npm install --prefer-offline 2>&1 || npm install

echo "[post-merge] Done."
