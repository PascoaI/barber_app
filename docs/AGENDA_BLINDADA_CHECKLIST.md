# Agenda blindada - checklist local

## 1) Configuração
1. Copie `.env.example` para `.env.local`.
2. Preencha as chaves Supabase do seu projeto.
3. Rode o SQL de endurecimento em `docs/AGENDA_HARDENING.sql`.

## 2) Build/test local
```bash
npm ci
# ou npm install se ainda não existir package-lock.json
npm run build
npm run lint
npm run test
```

## 3) Integração real (Next + Supabase)
Com a aplicação em execução e variáveis Supabase válidas, valide:
- `POST /api/appointments/create`
- `POST /api/appointments/validate-slot`
- `POST /api/cron/appointments-status`

As rotas usam `users`, `subscriptions`, `appointments` e `blocked_slots` com filtro por `tenant_id`/`unit_id` quando aplicável.

## 4) Cenários determinísticos obrigatórios
Os testes automatizados cobrem:
- criação de agendamento válido
- clique duplo (idempotência)
- overlap
- blocked slot
- transição inválida de status
- comportamento timezone-safe para próximo agendamento (UTC)

## 5) Execução única de ponta a ponta (script)
```bash
npm run check:agenda:full
```

Esse script tenta executar os 5 passos na ordem, gera resumo de PASS/WARN/FAIL e aponta claramente o que ainda falta no ambiente.
