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

run_required() {
  local label="$1"
  shift
  if "$@"; then
    pass "$label"
  else
    fail "$label"
  fi
}

run_optional() {
  local label="$1"
  shift
  if "$@"; then
    pass "$label"
  else
    warn "$label"
  fi
}

echo "[1/7] Integridade de migração legado <-> next"
run_required "scripts/check-parity.sh" ./scripts/check-parity.sh

echo "[2/7] Testes automatizados de regras críticas"
run_required "npm test" npm test

echo "[3/7] Build e lint de release"
run_optional "npm run build" npm run build
run_optional "npm run lint" npm run lint

echo "[4/7] Hardening da agenda (fluxo completo)"
run_required "npm run check:agenda:full" npm run check:agenda:full

echo "[5/7] Conectividade com banco (Supabase)"
run_optional "npm run check:supabase" npm run check:supabase

echo "[6/7] Smoke de APIs sem pagamento"
echo "ℹ️  obrigatório validar manualmente em staging:"
echo "   - POST /api/appointments/validate-slot"
echo "   - POST /api/appointments/create"
echo "   - POST /api/cron/appointments-status"
echo "   - telas login/registro/cliente/admin/barbeiro"

pass "checklist manual de smoke exibido"

echo "[7/7] Resultado final"
echo "Resumo: PASS=$PASS WARN=$WARN FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "Status final: NÃO VENDÁVEL ainda (itens obrigatórios falharam)."
  exit 1
fi

if [ "$WARN" -gt 0 ]; then
  echo "Status final: QUASE VENDÁVEL (há pendências não-bloqueantes/ambiente)."
  exit 0
fi

echo "Status final: VENDÁVEL (sem pagamentos online por enquanto)."
exit 0
