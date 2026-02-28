# MODELAGEM SQL – FASE 2 (SaaS COMPLETO)

Sintaxe padrão PostgreSQL (adaptável para MySQL).

## 1) Multi-tenant (plataforma)

```sql
CREATE TABLE platform_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_units INT,
    max_barbers INT,
    analytics_enabled BOOLEAN DEFAULT true,
    loyalty_enabled BOOLEAN DEFAULT true,
    stock_enabled BOOLEAN DEFAULT true,
    subscription_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    subscription_plan_id INT REFERENCES platform_plans(id),
    subscription_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 2) Unidades

```sql
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_units_tenant ON units(tenant_id);
```

## 3) Configurações por unidade

```sql
CREATE TABLE unit_settings (
    id SERIAL PRIMARY KEY,
    unit_id INT UNIQUE REFERENCES units(id) ON DELETE CASCADE,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    slot_interval_minutes INT DEFAULT 30,
    cancellation_limit_hours INT DEFAULT 2,
    loyalty_enabled BOOLEAN DEFAULT true,
    prepayment_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4) Usuários + RBAC

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id),
    name VARCHAR(150),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) CHECK (role IN ('client','barber','admin','super_admin')),
    blocked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_unit ON users(unit_id);
```

## 5) Barbeiros

```sql
CREATE TABLE barbers (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id),
    commission_percentage NUMERIC(5,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_barbers_unit ON barbers(unit_id);
```

## 6) Serviços

```sql
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    duration_minutes INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    requires_pre_payment BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_services_unit ON services(unit_id);
```

## 7) Agendamentos

```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id),
    client_id INT REFERENCES users(id),
    barber_id INT REFERENCES barbers(id),
    service_id INT REFERENCES services(id),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    status VARCHAR(50) CHECK (
        status IN ('pending','awaiting_payment','confirmed','canceled','completed','no_show')
    ) DEFAULT 'pending',
    requires_pre_payment BOOLEAN DEFAULT false,
    payment_due_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_unit ON appointments(unit_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_start ON appointments(start_datetime);
```

## 8) Bloqueio de horários

```sql
CREATE TABLE blocked_slots (
    id SERIAL PRIMARY KEY,
    barber_id INT REFERENCES barbers(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 9) Pagamentos + comissões

```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    appointment_id INT UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    payment_method VARCHAR(50),
    amount NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'paid',
    paid_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    barber_id INT REFERENCES barbers(id),
    appointment_id INT UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    commission_amount NUMERIC(10,2),
    calculated_at TIMESTAMP DEFAULT NOW()
);
```

## 10) Fidelidade

```sql
CREATE TABLE loyalty_points (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points_balance INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    appointment_id INT REFERENCES appointments(id),
    points_earned INT DEFAULT 0,
    points_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 11) Controle de estoque

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(150),
    quantity INT DEFAULT 0,
    minimum_stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_unit ON products(unit_id);

CREATE TABLE product_movements (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(10) CHECK (type IN ('in','out')),
    quantity INT NOT NULL,
    reason TEXT,
    related_appointment_id INT REFERENCES appointments(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 12) Assinaturas de cliente

```sql
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    unit_id INT REFERENCES units(id),
    name VARCHAR(100),
    price NUMERIC(10,2),
    sessions_per_month INT,
    duration_days INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    plan_id INT REFERENCES subscription_plans(id),
    remaining_sessions INT,
    expires_at TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('active','expired','canceled')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 13) Reviews

```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    appointment_id INT UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 14) Notificações

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 15) Logs de auditoria

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100),
    entity VARCHAR(100),
    entity_id INT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
```

## Observações importantes para implementação

- Todas as operações críticas devem usar transação (`BEGIN ... COMMIT/ROLLBACK`):
  - Finalizar `appointment`
  - Gerar pagamento
  - Calcular comissão
  - Debitar estoque
  - Gerar pontos
- Sempre validar:
  - `tenant_id`
  - `unit_id`
  - permissões RBAC
- Garantir isolamento multi-tenant:
  - Todas as queries devem filtrar por `tenant_id`
- Implementar soft delete quando necessário para manter histórico.


## 16) Robustez e maturidade (Fase 3)

```sql
-- Soft delete global
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE barbers ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE services ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE units ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP NULL;

-- Índices compostos para performance
CREATE INDEX idx_appointments_tenant_unit_start ON appointments(tenant_id, unit_id, start_datetime);
CREATE INDEX idx_appointments_barber_start ON appointments(barber_id, start_datetime);
CREATE INDEX idx_appointments_unit_status ON appointments(unit_id, status);
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX idx_products_unit_quantity ON products(unit_id, quantity);

-- Auditoria avançada
ALTER TABLE audit_logs ADD COLUMN ip_address INET;
ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN before_state JSONB;
ALTER TABLE audit_logs ADD COLUMN after_state JSONB;
```

### EXPLAIN (revisão obrigatória de queries críticas)

```sql
EXPLAIN SELECT unit_id, SUM(amount) FROM payments WHERE paid_at BETWEEN :start AND :end GROUP BY unit_id;
EXPLAIN SELECT barber_id, COUNT(*) FROM appointments WHERE unit_id = :unit AND start_datetime BETWEEN :start AND :end GROUP BY barber_id;
EXPLAIN SELECT * FROM appointments WHERE tenant_id = :tenant AND unit_id = :unit AND start_datetime BETWEEN :start AND :end ORDER BY start_datetime;
EXPLAIN SELECT DATE_TRUNC('month', paid_at) AS month, SUM(amount) FROM payments WHERE unit_id = :unit GROUP BY 1 ORDER BY 1 DESC;
```
