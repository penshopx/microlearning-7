#!/bin/bash
set -e

echo "[post-merge] Installing dependencies..."

# Ensure node-gyp is available (needed by some native packages)
if ! node -e "require('node-gyp')" 2>/dev/null; then
  echo "[post-merge] Installing node-gyp..."
  npm install node-gyp --save-dev --prefer-offline 2>&1 || npm install node-gyp --save-dev
fi

npm install --prefer-offline 2>&1 || npm install

echo "[post-merge] Done."
