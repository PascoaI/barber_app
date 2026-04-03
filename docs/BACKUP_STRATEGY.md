# Backup Strategy

## Objetivo

Estabelecer uma base operacional para backup do SaaS multi-tenant sem depender ainda de automacao externa.

## Escopo minimo

- Banco Supabase/Postgres: backup logico diario.
- Storage de logos e anexos: export semanal.
- Artefatos de deploy: manter rollback por SHA no GitHub Actions/Vercel.

## Procedimento recomendado

1. Banco:
   - Executar dump logico com `supabase db dump` ou `pg_dump`.
   - Nomear artefatos com data UTC e ambiente.
   - Armazenar em bucket privado fora da conta principal de execucao.
2. Storage:
   - Exportar objetos de branding/tenant semanalmente.
   - Versionar metadados do tenant junto do dump logico.
3. Restore drill:
   - Restaurar em ambiente isolado ao menos 1 vez por sprint.
   - Validar tenants, usuarios admin, servicos, barbeiros e audit logs.

## RPO / RTO base

- RPO alvo inicial: 24h.
- RTO alvo inicial: 4h.

## Itens obrigatorios no restore

- `tenants`
- `tenant_settings`
- `tenant_onboarding_requests`
- `users`
- `barbers`
- `services`
- `appointments`
- `audit_logs`

## Proximos passos

- Automatizar snapshots diarios.
- Monitorar falha de backup.
- Documentar restore parcial por tenant para suporte enterprise.
