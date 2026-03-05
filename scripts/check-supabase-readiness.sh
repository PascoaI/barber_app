#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

load_env_file() {
  local file="$1"
  [ -f "$file" ] || return 0
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    line="$(echo "$line" | xargs)"
    case "$line" in \#*) continue ;; esac
    key="${line%%=*}"
    value="${line#*=}"
    value="${value#\"}"
    value="${value%\"}"
    export "$key=$value"
  done < "$file"
}

load_env_file .env.local

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

SUPABASE_URL="${SUPABASE_URL%/}"
AUTH_HEADER="apikey: ${SERVICE_KEY}"
BEARER_HEADER="Authorization: Bearer ${SERVICE_KEY}"

check_table() {
  local table="$1"
  local url="${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1"
  local code
  code="$(curl -sS -o /tmp/supabase_${table}.json -w "%{http_code}" "$url" -H "$AUTH_HEADER" -H "$BEARER_HEADER")"
  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    echo "✅ ${table}: ok (${code})"
  else
    echo "❌ ${table}: failed (${code})"
    cat /tmp/supabase_${table}.json
    return 1
  fi
}

# health check
health_code="$(curl -sS -o /tmp/supabase_health.json -w "%{http_code}" "${SUPABASE_URL}/rest/v1/" -H "$AUTH_HEADER" -H "$BEARER_HEADER")"
if [ "$health_code" -lt 200 ] || [ "$health_code" -ge 300 ]; then
  echo "❌ Supabase REST unavailable (${health_code})"
  cat /tmp/supabase_health.json
  exit 1
fi

echo "✅ Supabase REST reachable (${health_code})"

failed=0
for table in appointments blocked_slots users subscriptions unit_settings; do
  check_table "$table" || failed=1
done

if [ "$failed" -ne 0 ]; then
  echo "❌ Supabase readiness failed"
  exit 1
fi

echo "✅ Supabase readiness OK"
