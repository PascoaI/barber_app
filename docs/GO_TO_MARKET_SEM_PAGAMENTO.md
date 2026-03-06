# Roadmap organizado: melhor ordem para tornar o produto vendável e completo

> Objetivo: sair do estado atual para **vendável agora (sem pagamento online)** e depois evoluir para **produto completo**.

## Visão geral da ordem (resumo executivo)
1. **Travar escopo comercial da fase atual** (sem gateway de pagamento).
2. **Garantir base técnica e segurança de ambiente** (Supabase + variáveis + hardening).
3. **Rodar qualidade técnica obrigatória** (paridade, testes, build, lint, agenda).
4. **Executar QA funcional em staging com roteiro fixo**.
5. **Preparar operação e suporte** (backup, incidentes, SLA, onboarding).
6. **Rodar piloto com clientes reais** e corrigir P0/P1.
7. **Escalar vendas** com processo repetível.
8. **Fase 2 (produto completo)**: pagamentos online, automações e analíticos avançados.

---

## Fase A — Produto vendável agora (sem pagamentos online)

### Passo 1 — Congelar escopo comercial (Dia 0)
Definir e documentar:
- O que vende agora: agenda, cliente/admin/barbeiro, histórico, fidelidade, assinaturas internas/local, notificações básicas.
- O que **não** vende agora: checkout online, cobrança recorrente via gateway.

**Saída obrigatória**
- Proposta comercial e material de vendas sem promessa de pagamento online.

### Passo 2 — Preparar ambiente e banco (Dia 1)
Ordem:
1. Configurar `.env.local` com variáveis reais do ambiente alvo.
2. Aplicar `docs/AGENDA_HARDENING.sql` no Supabase do ambiente.
3. Executar `npm run check:supabase`.

**Saída obrigatória**
- Conectividade REST ok e tabelas críticas acessíveis (2xx).

### Passo 3 — Qualidade técnica de release (Dia 1-2)
Rodar **nessa ordem**:
1. `./scripts/check-parity.sh`
2. `npm test`
3. `npm run build`
4. `npm run lint`
5. `npm run check:agenda:full`
6. `npm run check:go-live`

**Saída obrigatória**
- Sem FAIL nos checks obrigatórios.
- Se houver WARN, tratar antes de ir para produção (ou registrar aceite de risco).

### Passo 4 — QA funcional em staging (Dia 2)
Executar roteiro manual fixo:
- Login/registro/logout.
- Booking completo (unidade → serviço → profissional → data/hora → confirmação).
- Reagendamento e cancelamento.
- Admin: bloqueio de horários, configuração de unidade, mudança de status.
- Cliente: histórico, perfil, assinaturas locais, notificações.
- Cron: `POST /api/cron/appointments-status`.

**Saída obrigatória**
- 0 bug P0 e 0 inconsistência de dados entre telas e banco.

### Passo 5 — Operação e suporte (Dia 3)
Preparar:
- Rotina de backup e restore testada.
- Rotação de segredos/chaves documentada.
- Runbook de incidentes (queda, 5xx, falha de cron, indisponibilidade Supabase).
- Canal de suporte + SLA mínimo.

**Saída obrigatória**
- Time operacional consegue tocar sem depender do dev para rotina.

### Passo 6 — Piloto com clientes reais (Semana 1)
- Entrar com 1 a 3 barbearias.
- Medir diariamente: agendamentos concluídos, no-show, erros por rota, feedback do usuário.
- Corrigir rápido tudo que for P0/P1.

**Saída obrigatória**
- 7 dias de operação estável.
- Sem incidentes críticos em aberto.

### Passo 7 — Escalar vendas (Semana 2+)
- Publicar versão estável/changelog.
- Padronizar onboarding em checklist.
- Criar playbook comercial com objeções e limitações da fase atual.

**Saída obrigatória**
- Processo replicável de implantação + onboarding + suporte.

---

## Fase B — Produto completo (após fase vendável)

> Esta fase entra **depois** de estabilizar a venda sem gateway.

Ordem recomendada:
1. Pagamento online (checkout real + webhook assinado + reconciliação).
2. Cobrança recorrente e dunning.
3. Relatórios financeiros avançados e conciliação.
4. Automações de retenção (mensageria, recuperação de no-show, lembretes inteligentes).
5. Auditoria/compliance e trilhas de atividade.

**Regra de ouro:** não iniciar Fase B com backlog P0/P1 aberto da Fase A.

---

## Comando único de pré-go-live
```bash
npm run check:go-live
```

Esse comando centraliza os checks automatizados e devolve um status final:
- `NÃO VENDÁVEL`
- `QUASE VENDÁVEL`
- `VENDÁVEL (sem pagamentos online)`
