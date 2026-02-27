#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

status=0

echo "[parity] checking root/*.html <-> legacy/*.html"
while IFS= read -r legacy_file; do
  base="$(basename "$legacy_file")"
  root_file="$ROOT_DIR/$base"

  if [[ ! -f "$root_file" ]]; then
    echo "[parity][ERROR] missing root copy for legacy/$base"
    status=1
    continue
  fi

  if ! cmp -s "$legacy_file" "$root_file"; then
    echo "[parity][ERROR] mismatch: $base differs between root and legacy/"
    status=1
  fi
done < <(find "$ROOT_DIR/legacy" -maxdepth 1 -type f -name '*.html' | sort)

echo "[parity] checking script.js mirror"
if ! cmp -s "$ROOT_DIR/script.js" "$ROOT_DIR/public/script.js"; then
  echo "[parity][ERROR] script.js and public/script.js differ"
  status=1
fi

echo "[parity] checking styles.css mirror"
if ! cmp -s "$ROOT_DIR/styles.css" "$ROOT_DIR/public/styles.css"; then
  echo "[parity][ERROR] styles.css and public/styles.css differ"
  status=1
fi

if [[ "$status" -ne 0 ]]; then
  echo "[parity] FAILED"
  exit 1
fi

echo "[parity] OK - all mirrored files are synchronized"
