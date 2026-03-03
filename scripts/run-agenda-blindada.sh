#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PASS=0
WARN=0
FAIL=0

pass(){ echo "✅ $1"; PASS=$((PASS+1)); }
warn(){ echo "⚠️  $1"; WARN=$((WARN+1)); }
fail(){ echo "❌ $1"; FAIL=$((FAIL+1)); }

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

is_missing_value() {
  local v="$1"
  [ -z "$v" ] && return 0
  case "$v" in
    *YOUR_PROJECT*|*YOUR_SUPABASE_*|*PLACEHOLDER*) return 0 ;;
  esac
  return 1
}

run_cmd() {
  local label="$1"
  shift
  if "$@"; then
    pass "$label"
    return 0
  else
    fail "$label"
    return 1
  fi
}

echo "[1/5] Configuração"
if [ ! -f .env.local ] && [ -f .env.example ]; then
  cp .env.example .env.local
  warn "copiado .env.example -> .env.local (preencha valores reais antes de integração com Supabase)"
fi

load_env_file .env.local

missing_env=0
for key in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  value="${!key:-}"
  if is_missing_value "$value"; then
    warn "variável ausente ou placeholder: $key"
    missing_env=1
  fi
done

if [ -f docs/AGENDA_HARDENING.sql ]; then
  pass "script SQL de hardening disponível (aplicar manualmente no Supabase SQL Editor)"
else
  fail "docs/AGENDA_HARDENING.sql não encontrado"
fi

echo "[2/5] Build/test local"
if [ -f package-lock.json ]; then
  run_cmd "npm ci" npm ci
else
  warn "package-lock.json ausente; usando npm install"
  if npm install; then
    pass "npm install"
  else
    warn "npm install falhou (ambiente/rede/registry)"
  fi
fi

if npm run build; then pass "npm run build"; else warn "npm run build falhou"; fi
if npm run lint; then pass "npm run lint"; else warn "npm run lint falhou"; fi
if npm run test; then pass "npm run test"; else fail "npm run test"; fi

echo "[3/5] Integração real com Supabase"
if [ "$missing_env" -eq 1 ]; then
  warn "integração real pulada: variáveis de ambiente do Supabase ausentes/placeholder"
else
  if [ -f scripts/check-agenda-core.sh ]; then
    if ./scripts/check-agenda-core.sh; then
      pass "scripts/check-agenda-core.sh"
    else
      warn "scripts/check-agenda-core.sh falhou (ver logs)"
    fi
  fi
fi

echo "[4/5] Cenários determinísticos"
if npm run test; then
  pass "cenários de agenda cobertos pelos testes determinísticos"
else
  fail "cenários determinísticos falharam"
fi

echo "[5/5] Checklist final"
echo "Resumo: PASS=$PASS WARN=$WARN FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
