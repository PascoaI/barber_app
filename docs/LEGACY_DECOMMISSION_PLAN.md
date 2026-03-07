# Plano de Descomissionamento do Legado (.html + script.js)

## Objetivo
Encerrar a arquitetura híbrida (HTML estático + App Router) sem downtime, removendo dependências de:
- rewrites de `*.html`
- redirecionamento legado em `app/[slug]`
- scripts de paridade `legacy/`

## Escopo de remoção
- `next.config.mjs`: rewrites `/:path*.html` e `/index.html`
- `app/[slug]/page.tsx`: tabela `LEGACY_REDIRECTS`
- `scripts/check-parity.cjs`: auditoria de espelhos root/legacy/public
- diretórios/arquivos: `legacy/`, `legacy-src/`, `script.js`, `public/script.js`, `styles.css` legado

## Estratégia (4 fases)

### Fase 1 - Compatibilidade controlada (já preparada)
- Flags para desligamento gradual:
  - `ENABLE_LEGACY_HTML_REWRITES` (default: `true`)
  - `ENABLE_LEGACY_SLUG_REDIRECTS` (default: `true`)
  - `ENABLE_LEGACY_PARITY_CHECK` (default: `true`)
- Publicar com flags ligadas e monitorar tráfego legado.

### Fase 2 - Migração de tráfego
- Medir acessos em rotas `.html` e slugs legados.
- Atualizar links internos, e-mails e atalhos para rotas App Router definitivas.
- Adicionar redirecionamentos HTTP no edge/CDN para rotas novas.

### Fase 3 - Cutover
- Desligar em produção:
  - `ENABLE_LEGACY_HTML_REWRITES=false`
  - `ENABLE_LEGACY_SLUG_REDIRECTS=false`
  - `ENABLE_LEGACY_PARITY_CHECK=false`
- Manter janela de observação de 7 dias com monitoramento de 404/5xx.

### Fase 4 - Remoção definitiva
- Remover código e arquivos legados:
  - `app/[slug]/page.tsx`
  - rewrites legados no `next.config.mjs`
  - `legacy/`, `legacy-src/`, `script.js`, `public/script.js`
  - scripts de build/paridade de legado
- Limpar scripts `package.json` relacionados ao legado.

## Checklist de saída
- Nenhum acesso relevante a `.html` por 7 dias.
- Zero links internos apontando para `.html`.
- Fluxos críticos validados só em App Router:
  - login/register
  - agendamento ponta a ponta
  - dashboard admin/superadmin
  - billing/assinaturas
- CI sem dependência de artefatos legados.
