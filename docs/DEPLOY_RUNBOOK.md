# Deploy Runbook (Supabase + Stripe + Cron)

## 1) Pre-flight

1. Copie `.env.example` para `.env.local` e preencha as variaveis.
2. Valide:

```bash
npm run env:check:prod
```

## 2) Aplicar migracoes Supabase

### 2.1 Login Supabase CLI

```bash
npx supabase login
```

### 2.2 Link no projeto

```bash
npx supabase link --project-ref <SEU_PROJECT_REF>
```

### 2.3 Push das migracoes

```bash
npm run supabase:db:push
```

## 3) Configurar webhook Stripe

Endpoint:

- `POST <NEXT_PUBLIC_APP_URL>/api/stripe/webhook`

Eventos recomendados:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

No painel Stripe, copie o signing secret e grave em `STRIPE_WEBHOOK_SECRET`.

## 4) Cron jobs

Todos exigem header `x-cron-secret: CRON_SECRET`.

- Retry billing:
  - `POST /api/cron/billing-retry`
- Reconciliacao billing:
  - `POST /api/cron/billing-reconcile`
- Fechamento de status de agendamento:
  - `POST /api/cron/appointments-status`

Disparo manual local:

```bash
npm run cron:billing:retry
npm run cron:billing:reconcile
npm run cron:appointments:status
```

## 5) Pos deploy

1. Acesse `/superadmin/login` com usuario real do `auth.users` cadastrado em `public.super_admins`.
2. Crie uma barbearia e confirme:
   - registro em `barbershops`
   - usuario admin em `auth.users`
   - vinculo em `public.users`.
3. Gere checkout real e confirme chegada no webhook.
4. Verifique `billing_events` processando com status `processed`.

## 6) Rollback

- Workflow manual: `Rollback Production` (GitHub Actions)
- Input: `target_sha` (commit que deve ser reimplantado em producao).
- Estrategia:
  1. Selecionar ultimo commit estavel.
  2. Executar workflow de rollback.
  3. Monitorar logs e alertas operacionais por 15 minutos.
