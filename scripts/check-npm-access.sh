#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] npm registry configurado:"
npm config get registry

echo "[2/3] teste pacote npm (next):"
npm view next version >/dev/null && echo "OK: next" || echo "FALHA: next"

echo "[3/3] teste pacote npm (@types/node):"
npm view @types/node version >/dev/null && echo "OK: @types/node" || echo "FALHA: @types/node"
