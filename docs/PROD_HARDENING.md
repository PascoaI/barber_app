# Producao: hardening aplicado

## 1) Autenticacao segura (Supabase Auth/JWT)

- Middleware de autorizacao agora valida sessao JWT com Supabase (`auth.getUser()`), sem uso de cookie de role.
- Fluxo SuperAdmin removido de `localStorage` e migrado para APIs seguras em `app/api/superadmin/*`.
- Login/register publico agora e App Router nativo (`app/(public)/login`, `app/(public)/register`) sem `script.js`.
- Login protegido com:
  - rate limit por IP
  - lockout por tentativas falhas
  - validacao CSRF e same-origin
- Registro protegido com:
  - politica de senha forte
  - consentimento obrigatorio (termos + privacidade)

## 2) Fim da dependencia de espelho legado

- Home raiz nao renderiza mais HTML legado.
- Rota dinamica `app/[slug]` agora apenas redireciona slugs legados para rotas App Router explicitas.
- Paginas que ainda dependiam do mirror legado foram substituidas por componentes React placeholders, eliminando dependencia runtime de `script.js`.

## 3) Billing real com Stripe

- `POST /api/stripe/create-checkout-session` cria checkout real (modo subscription).
- `POST /api/stripe/webhook` valida assinatura do Stripe, aplica idempotencia e persiste eventos.
- Retry automatico: `POST /api/cron/billing-retry` (com `x-cron-secret`).
- Reconciliacao: `POST /api/cron/billing-reconcile` (com `x-cron-secret`).
- Suspensao automatica de tenant por inadimplencia via mapeamento de status do Stripe para `barbershops.status`.

## 4) Multi-tenant/RLS runtime

- Operacoes de agendamento em API usam cliente Supabase server-side com sessao do usuario, permitindo RLS em runtime.
- Escopo tenant padronizado para `barbershop_id` com fallback de compatibilidade legado.
- Migracao SQL adicionada para billing tenant-aware e politicas RLS:
  - `supabase/migrations/20260307113000_billing_stripe_runtime.sql`
- Migracao SQL de compliance e trilha LGPD:
  - `supabase/migrations/20260307123000_compliance_security.sql`

## 5) Observabilidade

- Logger estruturado: `lib/observability/logger.ts`
- Tracing basico: `lib/observability/tracing.ts`
- Alertas operacionais (webhook): `lib/observability/alerts.ts`
- Eventos criticos (billing/agendamento) ja emitem logs e alertas.

## 6) Hardening web

- Headers de seguranca via middleware:
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security` (prod)
- Cookie CSRF emitido no middleware e validado em rotas mutaveis.
- Rate limiting em endpoints criticos.
- Brute force mitigado com lockout.

## 7) UX para falhas

- Outbox offline de agendamento:
  - solicitações de agendamento sao enfileiradas localmente em falhas de rede/5xx
  - reenvio automatico quando conexao retorna.

## 8) CI/CD e release

- Pipeline CI com lint, typecheck, testes, build e verificacao de migrations:
  - `.github/workflows/ci.yml`
- Preview em PR (quando segredos Vercel estiverem configurados):
  - `.github/workflows/preview.yml`
- Rollback manual por SHA para producao:
  - `.github/workflows/rollback.yml`

## 6) Variaveis obrigatorias

Ver `.env.example` para:

- Supabase
- Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`)
- Cron (`CRON_SECRET`)
- Alertas (`OPS_ALERT_WEBHOOK_URL`)
