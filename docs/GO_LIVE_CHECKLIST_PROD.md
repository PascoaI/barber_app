# Go-Live Checklist (Produção SaaS Multi-Tenant)

Este checklist cobre o que falta para operar em produção com segurança, billing real, observabilidade e compliance básico.

## 1) Ambientes e segredos (GitHub + Vercel/Supabase)

### Obrigatórios em `prod`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_ENTERPRISE`
- `SENTRY_DSN`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OPS_ALERT_WEBHOOK_URL`

### Recomendados
- `APP_ENV=prod`
- `SENTRY_TRACES_SAMPLE_RATE` (ex.: `0.2`)
- `BILLING_GRACE_DAYS` (ex.: `3`)
- `APP_BASE_DOMAIN`
- `DEFAULT_TENANT_SLUG`

### Validação
- Rodar:
```bash
npm run env:check:matrix
```
com `TARGET_ENV=prod`.

## 2) Banco de dados (Supabase)

### Migrations
- Aplicar todas as migrations em ordem:
```bash
npm run check:migrations
npm run supabase:db:push
```

### Conferir objetos críticos
- Tabelas:
  - `barbershops`
  - `users`
  - `appointments`
  - `billing_subscriptions`
  - `billing_events`
  - `client_privacy_requests`
  - `privacy_exports`
  - `audit_logs`
  - `operational_metrics`
- Funções:
  - `public.current_barbershop_id()`
  - `public.is_super_admin()`
- RLS habilitado nas tabelas multi-tenant e políticas ativas.

## 3) Billing Stripe (real)

### Stripe Dashboard
- Criar/preparar produtos e preços (Basic/Pro/Enterprise).
- Confirmar `price_id` igual aos segredos do ambiente.
- Configurar webhook para:
  - `checkout.session.completed`
  - `customer.subscription.*`
  - `invoice.payment_failed`
- URL webhook:
  - `/api/stripe/webhook`

### Runtime
- Validar idempotência de eventos na tabela `billing_events`.
- Validar retry/reconcile:
```bash
npm run cron:billing:retry
npm run cron:billing:reconcile
```

## 4) Segurança operacional

- Rate limit distribuído (Upstash) ativo em login/APIs críticas.
- CSRF e same-origin ativos nas rotas de mutação.
- Sem uso de role em `localStorage` para autorização de backend.
- SuperAdmin isolado de usuários operacionais de tenant.

## 5) LGPD operacional

- Fluxo de request ativo:
  - `POST /api/privacy/client-request`
- Processamento automático ativo:
  - `POST /api/cron/privacy-process` com `x-cron-secret`
- Exportação administrativa ativa:
  - `POST /api/privacy/export-client`
- Auditoria registrada em `audit_logs`.

## 6) Observabilidade e alertas

- Sentry ativo com `SENTRY_DSN`.
- Coleta de métricas operacionais em `operational_metrics`.
- Dashboard de saúde:
  - `GET /api/observability/dashboard`
  - inclui erro, latência p95, conversão de agendamentos e falhas de pagamento.
- Alertas operacionais via `OPS_ALERT_WEBHOOK_URL`.

## 7) Cron jobs (produção)

Agendar execução segura (com `x-cron-secret`) para:
- `/api/cron/appointments-status`
- `/api/cron/billing-retry`
- `/api/cron/billing-reconcile`
- `/api/cron/privacy-process`

Recomendação inicial:
- appointments-status: a cada 5 min
- billing-retry: a cada 15 min
- billing-reconcile: a cada 60 min
- privacy-process: a cada 60 min

## 8) Qualidade de release

Pipeline obrigatório antes de deploy:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run check:migrations`

## 9) Smoke test pós-deploy (produção)

- Login cliente e admin.
- Agendamento completo (criar -> confirmar -> concluir).
- Cancelamento.
- No-show automático.
- Assinatura/checkout e atualização de status.
- Acesso SuperAdmin (CRUD barbearias).
- Dashboard de observabilidade respondendo.

## 10) Rollback

- Em incidente crítico:
  - usar workflow `rollback.yml` com `target_sha` conhecido estável.
- Sempre registrar:
  - timestamp
  - SHA restaurado
  - motivo
  - impacto

