#!/usr/bin/env bash
set -e
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js not found. Install LTS from https://nodejs.org/"
  exit 1
fi
if [ -f "package-lock.json" ]; then npm ci; else npm install; fi
export NEXT_TELEMETRY_DISABLED=1
echo "Starting Prompt Engineer Pro on http://localhost:3010 ..."
npm run dev
