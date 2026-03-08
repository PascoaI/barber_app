# Plano de Descomissionamento do Legado (.html + script.js)

## Objetivo
Encerrar a arquitetura hibrida (HTML estatico + App Router) sem downtime, removendo dependencias de:
- rewrites de `*.html`
- redirecionamento legado em `app/[slug]`
- scripts de paridade `legacy/`

## Escopo de remocao
- `next.config.mjs`: rewrites `/:path*.html` e `/index.html`
- `app/[slug]/page.tsx`: tabela `LEGACY_REDIRECTS`
- `scripts/check-parity.cjs`: auditoria de espelhos root/legacy/public
- diretorios/arquivos: `legacy/`, `legacy-src/`, `script.js`, `public/script.js`, `styles.css` legado

## Estrategia (4 fases)

### Fase 1 - Compatibilidade controlada
- Flags para desligamento gradual:
  - `ENABLE_LEGACY_HTML_REWRITES` (default: `false`)
  - `ENABLE_LEGACY_SLUG_REDIRECTS` (default: `false`)
  - `ENABLE_LEGACY_PARITY_CHECK` (default: `false`)
- Ativar temporariamente somente se houver dependencia real de links antigos.

### Fase 2 - Migracao de trafego
- Medir acessos em rotas `.html` e slugs legados.
- Atualizar links internos, e-mails e atalhos para rotas App Router definitivas.
- Adicionar redirecionamentos HTTP no edge/CDN para rotas novas.

### Fase 3 - Cutover
- Em producao, manter:
  - `ENABLE_LEGACY_HTML_REWRITES=false`
  - `ENABLE_LEGACY_SLUG_REDIRECTS=false`
  - `ENABLE_LEGACY_PARITY_CHECK=false`
- Janela de observacao de 7 dias com monitoramento de 404/5xx.

### Fase 4 - Remocao definitiva
- Remover codigo e arquivos legados:
  - `app/[slug]/page.tsx`
  - rewrites legados no `next.config.mjs`
  - `legacy/`, `legacy-src/`, `script.js`, `public/script.js`
  - scripts de build/paridade de legado
- Limpar scripts `package.json` relacionados ao legado.

## Checklist de saida
- Nenhum acesso relevante a `.html` por 7 dias.
- Zero links internos apontando para `.html`.
- Fluxos criticos validados so em App Router:
  - login/register
  - agendamento ponta a ponta
  - dashboard admin/superadmin
  - billing/assinaturas
- CI sem dependencia de artefatos legados.

