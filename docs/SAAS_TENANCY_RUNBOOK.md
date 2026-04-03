# SaaS Tenancy Runbook

## O que foi padronizado

- `tenant_id` virou o identificador SaaS canonico.
- `barbershop_id` continua como alias de compatibilidade para nao quebrar o legado.
- `tenants` concentra `name`, `slug` e `status`.
- `tenant_settings` centraliza branding e horario operacional.
- `tenant_onboarding_requests` controla o onboarding publico com aprovacao manual.

## Fluxo operacional

1. A barbearia envia uma solicitacao publica em `/barbershop-signup`.
2. O registro entra como `pending`.
3. O superadmin aprova em `/superadmin/barbershops`.
4. Na aprovacao sao criados:
   - `barbershops`
   - `tenants`
   - `tenant_settings`
   - usuario admin em `auth.users`
   - perfil `admin` em `public.users`
5. O tenant passa a operar pelo slug e pelo painel `/admin`.

## Regras de acesso

- `super_admin`: visao total.
- `admin`: acesso apenas ao proprio tenant.
- `barber` e `client`: restritos ao tenant vinculado.

## Rotas novas

- `POST /api/public/onboarding-requests`
- `GET /api/superadmin/onboarding-requests`
- `PATCH /api/superadmin/onboarding-requests/[id]`
- `GET|PATCH /api/admin/tenant`
- `GET|POST /api/admin/barbers`
- `PATCH|DELETE /api/admin/barbers/[id]`
- `GET|POST /api/admin/services`
- `PATCH|DELETE /api/admin/services/[id]`
- `GET /api/admin/reports`

## Observabilidade e auditoria

Toda aprovacao, rejeicao e alteracao administrativa do tenant grava evento em `audit_logs`.

## Rollback

- Aplicar rollback do app pelo workflow existente `Rollback Production`.
- Em caso de falha de migracao, restaurar dump logico anterior antes de reabrir trafego.
