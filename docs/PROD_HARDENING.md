# Producao: hardening aplicado

## 1) Autenticacao segura (Supabase Auth/JWT)

- Middleware de autorizacao agora valida sessao JWT com Supabase (`auth.getUser()`), sem uso de cookie de role.
- Fluxo SuperAdmin removido de `localStorage` e migrado para APIs seguras em `app/api/superadmin/*`.
- Login/register publico agora e App Router nativo (`app/(public)/login`, `app/(public)/register`) sem `script.js`.

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

## 5) Observabilidade

- Logger estruturado: `lib/observability/logger.ts`
- Tracing basico: `lib/observability/tracing.ts`
- Alertas operacionais (webhook): `lib/observability/alerts.ts`
- Eventos criticos (billing/agendamento) ja emitem logs e alertas.

## 6) Variaveis obrigatorias

Ver `.env.example` para:

- Supabase
- Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`)
- Cron (`CRON_SECRET`)
- Alertas (`OPS_ALERT_WEBHOOK_URL`)
