# Evolucao Operacional do Modulo Barbeiro

## 1. Diagnostico objetivo

### O que existe hoje
- A home do barbeiro em `app/barber/page.tsx` e centrada em agenda.
- O barbeiro enxerga cards de atendimento com dados basicos (cliente, horario, valor, observacoes).
- A unica acao operacional efetiva do barbeiro hoje e **concluir servico** (`concludeBarberService`), que chama `POST /api/appointments/confirm-service`.
- O backend ja trabalha com status em ingles (`pending`, `confirmed`, `awaiting_payment`, `completed`, `no_show`, `canceled`) e politica em `lib/appointments-policy.ts`.

### Lacunas atuais
- Nao existe status **EM_ANDAMENTO** no fluxo migrado.
- Nao existe acao de **no-show** e **cancelamento** feita pelo barbeiro na home migrada.
- Nao existe captura de justificativa para **NO_SHOW** ou **CANCELADO**.
- Nao existe acao de **atraso**, **remarcacao operacional** e **transferencia para outro barbeiro**.
- Nao existe visao de **historico do cliente** dentro do card da agenda do barbeiro.
- Existe inconsistencia de vocabulario de status entre migration antiga (`scheduled/cancelled`) e codigo atual (`pending/confirmed/canceled`).

## 2. Proposta de solucao (pratica)

## Principio
- Manter a home do barbeiro com agenda no centro.
- Adicionar acoes no proprio card do atendimento.
- Nao expor gestao de disponibilidade no modulo barbeiro.

### 2.1 Modelo de status operacional
- Manter status tecnico interno em ingles no banco.
- Exibir nomenclatura operacional na UI:
  - `AGENDADO` -> (`pending`, `confirmed`, `awaiting_payment`)
  - `EM_ANDAMENTO` -> (`in_progress`) **novo**
  - `CONCLUIDO` -> (`completed`)
  - `NO_SHOW` -> (`no_show`)
  - `CANCELADO` -> (`canceled`)

### 2.2 Campos minimos novos em `appointments`
- `status_reason text null` (justificativa curta para no_show/canceled)
- `delay_minutes integer null` (atraso sinalizado)
- `delay_reason text null`
- `transferred_from_barber_id uuid null`
- `transferred_to_barber_id uuid null`
- `rescheduled_from timestamptz null`
- `rescheduled_by text null` (`barber|admin|client|system`)

Obs.: evitar criar modulo pesado. Se precisar trilha detalhada, adicionar tabela simples `appointment_events`.

### 2.3 API operacional dedicada do barbeiro
- Novo endpoint: `PATCH /api/barber/appointments/[id]/status`
  - payload: `{ to_status, reason? }`
  - valida permissao: barbeiro dono do atendimento ou admin.
  - aplica matriz de transicao.
- Novo endpoint: `PATCH /api/barber/appointments/[id]/delay`
  - payload: `{ delay_minutes, delay_reason? }`
- Novo endpoint: `PATCH /api/barber/appointments/[id]/reschedule`
  - reaproveita regra de conflito/janela do fluxo atual.
- Novo endpoint: `PATCH /api/barber/appointments/[id]/transfer`
  - payload: `{ to_barber_id, keep_datetime?: boolean, start_datetime? }`
  - valida barbeiro destino ativo e sem conflito.
- Novo endpoint: `GET /api/barber/appointments/[id]/client-context`
  - retorna historico resumido para o card/drawer.

## 3. Estrutura sugerida da home do barbeiro

### Estrutura (sem descaracterizar)
- Cabecalho: data, filtros rapidos, contadores.
- **Agenda como bloco principal**:
  - cards por atendimento, ordenados por horario.
  - badge de status operacional.
  - dados essenciais visiveis.
- Acao por card:
  - botoes rapidos principais.
  - menu "Mais acoes" para operacoes secundarias.
- Drawer/expansao "Contexto do cliente":
  - historico recente + ultimos servicos + observacoes.

### Layout de card
- Linha 1: horario + cliente + servico + status.
- Linha 2: observacao atual e sinais (atraso, remarcado, transferido).
- Linha 3: botoes:
  - iniciar
  - concluir
  - no-show
  - cancelar
  - remarcar
  - transferir
  - sinalizar atraso

## 4. Fluxo de status sugerido

### Status finais
- `in_progress` (EM_ANDAMENTO)
- `completed` (CONCLUIDO)
- `no_show`
- `canceled`

### Estados de entrada (agendado)
- `pending`, `confirmed`, `awaiting_payment` => exibidos como `AGENDADO`.

### Transicoes permitidas
- `pending|confirmed|awaiting_payment` -> `in_progress|no_show|canceled`
- `in_progress` -> `completed|canceled`
- `no_show|canceled|completed` -> sem transicao operacional direta

### Quem pode alterar
- Barbeiro: atendimento sob sua responsabilidade.
- Admin: qualquer atendimento da barbearia.
- Cliente: apenas cancelamento/remarcacao nas regras ja existentes (fora do fluxo operacional interno do barbeiro).

### Regras de justificativa
- Obrigatorio `reason` para:
  - `to_status = no_show`
  - `to_status = canceled` (quando feito por barbeiro/admin)

## 5. Acoes por agendamento (na agenda/home)

### Se status operacional = AGENDADO
- Iniciar atendimento (`in_progress`)
- Marcar no-show (com justificativa)
- Marcar cancelado (com justificativa)
- Sinalizar atraso
- Remarcar atendimento
- Transferir para outro barbeiro

### Se status operacional = EM_ANDAMENTO
- Concluir servico (`completed`)
- Cancelar (com justificativa)
- Sinalizar atraso adicional

### Se status operacional = CONCLUIDO / NO_SHOW / CANCELADO
- Somente leitura + historico de eventos
- (Opcional admin) reabrir via fluxo administrativo controlado

## 6. Dados complementares do cliente (contexto)

### Minimo necessario no card/drawer
- Nome do cliente
- Historico recente (ultimos 5 atendimentos)
- Ultimos 3 servicos realizados
- Data do ultimo atendimento
- Observacoes do agendamento atual (`notes`)
- Marcadores operacionais:
  - no_show anterior (contagem 90 dias)
  - cancelamentos recentes
  - preferencia de servico/profissional (se houver)

### Fonte sugerida
- Reaproveitar `appointments` + `services` + `users`.
- Criar funcao agregadora em `lib/barber-dashboard.ts` para trazer contexto por lote.

## 7. Separacao de responsabilidades

### Barbeiro (operacao diaria)
- Atualizar status operacional do atendimento
- Registrar justificativas de no_show/cancelado
- Sinalizar atraso
- Remarcar e transferir dentro de regras
- Consultar contexto do cliente

### Admin (planejamento/disponibilidade)
- Bloqueios de horario
- Pausas/folgas/ferias
- Indisponibilidades recorrentes
- Regras de expediente e buffers
- Politicas gerais de remarcacao/cancelamento

Regra mantida: **barbeiro nao gerencia disponibilidade estrutural**.

## 8. Implementacao gradual (ordem recomendada)

### Fase 1 - Fundacao de status operacional
- Adicionar `in_progress` nas politicas (`lib/appointments-policy.ts` e `lib/server/appointment-core.js`).
- Criar endpoint de troca de status do barbeiro com permissao e validacao.
- Atualizar home do barbeiro para mostrar status operacional.

### Fase 2 - Acoes principais na home
- Iniciar, concluir, no-show, cancelar (com modal de justificativa quando obrigatorio).
- Feedback visual (loading/sucesso/erro) por card.

### Fase 3 - Remarcacao, atraso e transferencia
- Implementar endpoints e UI de remarcacao, delay e transferencia.
- Reusar validacoes existentes de conflito/expediente.

### Fase 4 - Contexto do cliente
- Endpoint de contexto por atendimento.
- Drawer no card com historico e ultimos servicos.

### Fase 5 - Observabilidade e robustez
- Auditoria de mudancas (`updated_by`, evento, motivo).
- Metricas basicas: no_show por barbeiro, tempo medio em andamento, transferencias.

## Observacoes finais de arquitetura
- Evitar quebrar o status atual de todo o sistema de uma vez.
- Introduzir `in_progress` de forma incremental e manter compatibilidade com status existentes.
- Padronizar nomenclatura de exibicao no frontend (portugues operacional), mantendo storage tecnico em ingles.
