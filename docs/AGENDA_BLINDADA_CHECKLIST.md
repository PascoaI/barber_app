# Agenda blindada - checklist local

## 1) Configuração
1. Copie `.env.example` para `.env.local`.
2. Preencha as chaves Supabase do seu projeto.
3. Rode o SQL de endurecimento em `docs/AGENDA_HARDENING.sql`.

## 2) Comandos
```bash
npm ci
npm run build
npm run lint
npm run test
```

## 3) O que os testes cobrem
- criação de agendamento válido
- clique duplo (idempotência)
- overlap
- blocked slot
- transição inválida de status
- comportamento timezone-safe para próximo agendamento (UTC)

## 4) Verificação de integração real
Com a aplicação em execução e variáveis Supabase válidas:
- `POST /api/appointments/create`
- `POST /api/appointments/validate-slot`
- `POST /api/cron/appointments-status`

As rotas usam `users`, `subscriptions`, `appointments` e `blocked_slots` com filtro por `tenant_id`/`unit_id` quando aplicável.
