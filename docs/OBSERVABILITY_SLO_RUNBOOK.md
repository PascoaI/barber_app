# Observability SLO + Runbook

## Objetivo
Padronizar monitoração e resposta a incidentes para os fluxos criticos:
- autenticacao
- agendamentos
- cobranca (Stripe)
- operacao de SuperAdmin

## SLOs recomendados

### API availability
- SLO: `>= 99.9%` de requests com status `<500` em 30 dias.
- SLI fonte: logs estruturados + `operational_metrics` (`api_error`).

### Latencia API
- SLO: p95 `< 800ms` em endpoints criticos.
- Endpoints criticos:
  - `/api/auth/login`
  - `/api/appointments/create`
  - `/api/appointments/validate-slot`
  - `/api/stripe/create-checkout-session`
  - `/api/stripe/webhook`

### Conversao de agendamento
- SLO: taxa diaria de conclusao `>= 75%` para agendamentos considerados.
- SLI fonte: `/api/observability/dashboard` (`booking_conversion_rate_today`).

### Falha de pagamento
- SLO: `invoice/payment failure < 3%` no periodo de 24h.
- SLI fonte: `payment_failures_24h` + tabelas `billing_events`/`billing_subscriptions`.

## Alertas recomendados

### Critico (pager)
- Erro API 5xx acima de 2% por 5 minutos.
- Falha de webhook Stripe por 3 tentativas consecutivas.
- `billing_subscriptions` com crescimento anormal de `past_due/unpaid`.

### Alto (canal operacional)
- p95 acima de 800ms por 10 minutos.
- Conversao diaria abaixo de 60%.
- Erros de rate-limit backend indisponivel em producao.

## Runbook de incidente

1. Confirmar impacto
- Verificar dashboard `/api/observability/dashboard`.
- Checar logs recentes por `traceId`.

2. Classificar
- `SEV1`: login/agendamento/cobranca indisponivel.
- `SEV2`: degradacao parcial, sem indisponibilidade total.

3. Mitigar
- Cobranca: executar retry/reconcile.
  - `npm run cron:billing:retry`
  - `npm run cron:billing:reconcile`
- Agendamento: validar bloqueios/status.
  - `npm run cron:appointments:status`
- LGPD queue:
  - `npm run cron:privacy:process`

4. Rollback (se necessario)
- Usar workflow `rollback.yml` com SHA estavel.
- Registrar causa, janela de impacto e acao tomada.

5. Pos-mortem
- Causa raiz.
- Acao preventiva.
- Teste automatizado adicionado para evitar recorrencia.

