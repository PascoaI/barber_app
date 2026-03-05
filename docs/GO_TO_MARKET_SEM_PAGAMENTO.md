# Ordem correta para chegar no produto 100% vendável (sem pagamento online por enquanto)

> Escopo: vender a operação de barbearia com agenda, clientes, admin, estoque e assinatura manual/local, **sem gateway de pagamento** nesta fase.

## Etapa 1 — Congelar escopo comercial (Dia 0)
Definir oficialmente o que está dentro e fora do produto vendido:
- Dentro: agenda, gestão cliente/admin/barbeiro, histórico, fidelidade, assinaturas internas, notificações básicas.
- Fora (fase futura): checkout online, cobrança recorrente automática por gateway.

Critério de saída:
- Documento comercial e proposta sem promessa de pagamento online.

## Etapa 2 — Banco e segurança de ambiente (Dia 1)
1. Configurar `.env.local` com chaves reais por ambiente.
2. Aplicar `docs/AGENDA_HARDENING.sql` no projeto Supabase alvo.
3. Executar `npm run check:supabase`.

Critério de saída:
- Conectividade REST e tabelas críticas respondendo 2xx.

## Etapa 3 — Qualidade técnica de release (Dia 1-2)
Executar, nesta ordem:
1. `./scripts/check-parity.sh`
2. `npm test`
3. `npm run build`
4. `npm run lint`
5. `npm run check:agenda:full`

Critério de saída:
- Sem FAIL em checks obrigatórios.

## Etapa 4 — Smoke funcional em staging (Dia 2)
Testar manualmente fluxos reais ponta a ponta:
- Login e registro.
- Fluxo de agendamento completo (escolha de unidade/serviço/profissional/data).
- Reagendamento e cancelamento.
- Painel admin: bloqueios de horário, status de agenda, configurações por unidade.
- Painel cliente: histórico, perfil, assinaturas locais, notificações.
- Cron de status: `POST /api/cron/appointments-status`.

Critério de saída:
- 0 bugs bloqueantes (P0) e 0 inconsistência de dados entre telas.

## Etapa 5 — Operação e suporte (Dia 3)
Preparar o básico de operação para clientes pagantes:
- Procedimento de backup/restore do banco.
- Procedimento para trocar chaves e rotação de segredo.
- Runbook de incidentes (queda, erro 500, falha de cron).
- Canal e SLA de suporte.

Critério de saída:
- Equipe consegue operar sem depender do dev para tarefas repetitivas.

## Etapa 6 — Piloto pago controlado (Semana 1)
- Entrar com 1-3 barbearias piloto.
- Monitorar diariamente: taxa de agendamento concluído, no-show, erros por rota, feedback.
- Corrigir rápido bugs críticos.

Critério de saída:
- 7 dias com estabilidade operacional e satisfação mínima acordada.

## Etapa 7 — Escalar venda (Semana 2+)
- Publicar política de versão e changelog.
- Treinamento curto de onboarding.
- Oferta comercial oficial com limites da fase sem pagamento online.

Critério de saída:
- Funil de venda ativo com onboarding replicável.

---

## Comando único para pré-go-live
```bash
npm run check:go-live
```

Esse comando centraliza os checks automatizados disponíveis hoje e retorna status final (vendável/quase vendável/não vendável).
