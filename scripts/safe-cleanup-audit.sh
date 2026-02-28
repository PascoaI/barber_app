#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "# Safe Cleanup Audit"
echo
echo "Generated at: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo

echo "## Referências críticas encontradas"
echo "- app/[slug]/page.tsx -> usa lib/legacy.ts para servir páginas de legacy"
echo "- app/layout.tsx -> carrega /styles.css (arquivo em public)"
echo "- next.config.mjs -> rewrites de *.html para rotas Next"
echo

echo "## Verificação de pares root/legacy"
missing=0
while IFS= read -r f; do
  base="$(basename "$f")"
  if [[ ! -f "$base" ]]; then
    echo "- FALTANDO na raiz: $base (existe em legacy/)"
    missing=1
  fi
done < <(find legacy -maxdepth 1 -type f -name '*.html' | sort)

if [[ "$missing" -eq 0 ]]; then
  echo "- OK: todos os HTML de legacy/ têm cópia equivalente na raiz."
fi

echo
echo "## Resultado"
echo "- Não há remoções seguras automáticas sem risco de quebrar compatibilidade (Next + modo estático legado)."
echo "- Recomendação: manter estrutura atual até migração completa do frontend legado."
