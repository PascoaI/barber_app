# Safe Cleanup Audit

Generated at: 2026-02-27T15:36:05Z

## Referências críticas encontradas
- app/[slug]/page.tsx -> usa lib/legacy.ts para servir páginas de legacy
- app/layout.tsx -> carrega /styles.css (arquivo em public)
- next.config.mjs -> rewrites de *.html para rotas Next

## Verificação de pares root/legacy
- OK: todos os HTML de legacy/ têm cópia equivalente na raiz.

## Resultado
- Não há remoções seguras automáticas sem risco de quebrar compatibilidade (Next + modo estático legado).
- Recomendação: manter estrutura atual até migração completa do frontend legado.
