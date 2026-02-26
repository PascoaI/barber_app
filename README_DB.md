# Banco de dados grátis (Supabase)

Este projeto já está preparado para usar **Supabase Free** na tabela `appointments`.

## 1) Criar projeto grátis
- Acesse: https://supabase.com
- Crie projeto free.

## 2) Criar tabela
No SQL Editor execute:

```sql
create table if not exists appointments (
  id bigint generated always as identity primary key,
  city text not null,
  branch text not null,
  address text,
  service text not null,
  professional text,
  professional_id text,
  date text not null,
  time text not null,
  price numeric,
  client_email text,
  client_name text,
  created_at timestamptz default now()
);
```

## 3) Configurar no front-end
No arquivo `script.js`, bloco `DB_CONFIG`, preencher:
- `supabaseUrl`
- `supabaseAnonKey`

Com isso:
- confirmação de agendamento grava na tabela `appointments`
- "Meus horários" e "Admin > Agendamentos" leem da tabela
- se não configurar, o sistema usa `localStorage` como fallback


## Permissões de agenda
- Admin: visualiza todos os agendamentos e filtra por barbeiro.
- Barbeiro: visualiza apenas agendamentos vinculados ao seu nome/ID.
- Cliente: visualiza apenas seus próprios horários.


## Configurações da barbearia (layout)
- No painel Admin > Configurações, o administrador define:
  - nome da barbearia
  - cor predominante
  - logo (URL ou arquivo)
- Esses dados são aplicados ao cliente após login para identificar a barbearia.
