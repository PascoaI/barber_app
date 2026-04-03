# Deploy Runbook (Supabase + Vercel + Cron)

## 1) Pre-flight

1. Copie `.env.example` para `.env.local` e preencha as variaveis.
2. Valide:

```bash
npm run env:check:prod
```

## 1.1) Projeto na Vercel

1. Importe o repositório na Vercel.
2. Framework preset: `Next.js`.
3. Root directory: raiz do repositório.
4. Build command: deixe o padrao da Vercel ou use `npm run build`.
5. Output directory: nao definir manualmente.

## 1.2) Environment Variables na Vercel

Cadastre no projeto da Vercel, em Preview e Production, no minimo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

Se billing/observabilidade estiverem ativos, adicionar tambem:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_ENTERPRISE`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OPS_ALERT_WEBHOOK_URL`

Sugestao para `NEXT_PUBLIC_APP_URL`:

- Preview: URL gerada pela Vercel para o ambiente preview
- Production: dominio final, por exemplo `https://seu-app.vercel.app` ou dominio customizado

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

## 3) Configurar dominio e deploy

1. Faça deploy da branch de preview pela Vercel.
2. Valide as rotas:
   - `/login`
   - `/barbershop-signup`
   - `/superadmin/login`
   - `/api/onboarding-requests`
3. Quando estiver estavel, promova para production.

## 4) Configurar webhook Stripe

Endpoint:

- `POST <NEXT_PUBLIC_APP_URL>/api/stripe/webhook`

Eventos recomendados:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

No painel Stripe, copie o signing secret e grave em `STRIPE_WEBHOOK_SECRET`.

## 5) Cron jobs

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

O arquivo [`vercel.json`](C:/Users/PC-Casa/.codex/worktrees/fbcc/barber_app-main/vercel.json) ja define os schedules base para a Vercel.

## 6) Pos deploy

1. Acesse `/superadmin/login` com usuario real do `auth.users` cadastrado em `public.super_admins`.
2. Crie uma barbearia e confirme:
   - registro em `barbershops`
   - registro em `tenants`
   - registro em `tenant_settings`
   - usuario admin em `auth.users`
   - vinculo em `public.users`.
3. Teste o onboarding publico em `/barbershop-signup`.
4. Aprove a solicitacao em `/superadmin/barbershops`.
5. Gere checkout real e confirme chegada no webhook.
6. Verifique `billing_events` processando com status `processed`.

## 7) Rollback

- Workflow manual: `Rollback Production` (GitHub Actions)
- Input: `target_sha` (commit que deve ser reimplantado em producao).
- Estrategia:
  1. Selecionar ultimo commit estavel.
  2. Executar workflow de rollback.
  3. Monitorar logs e alertas operacionais por 15 minutos.
