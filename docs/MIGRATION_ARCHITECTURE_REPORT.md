# Relatório interno de arquitetura (pré-migração)

## Páginas mapeadas
- Pública/autenticação: `index.html`, `login.html`, `register.html`.
- Booking: `booking-location.html`, `booking-service.html`, `booking-professional.html`, `booking-datetime.html`, `booking-review.html`, `booking.html`.
- Cliente: `client-home.html`, `my-schedules.html`, `client-history.html`, `client-loyalty.html`, `client-profile.html`, `client-notifications.html`, `client-subscriptions.html`.
- Admin/barber/super-admin: `admin-home.html`, `admin-schedules.html`, `admin-barbers.html`, `admin-blocked-slots.html`, `admin-finance.html`, `admin-settings.html`, `admin-stock.html`, `admin-subscriptions.html`, `admin-unit-settings.html`, `barber-home.html`, `super-admin-tenants.html`.

## Scripts e dependências
- `script.js` é o motor central e global.
- Dependências de DOM por IDs/classes (eventos em `form`, `select`, `button`, grids, nav quick links, etc.).
- Dependências de persistência: `localStorage` via `STORAGE_KEYS`.

## Fluxos críticos identificados
- Autenticação/sessão: login, papel (`client/admin/barber/super_admin`), redirects e expiração.
- Booking: cidade -> unidade -> serviço -> profissional -> data/horário -> review/confirm.
- Cliente: reagendamento/cancelamento, histórico, fidelidade, assinaturas, perfil, notificações.
- Admin: agenda/status, barbeiros, bloqueios, financeiro, estoque, configurações.

## Estado e regras
- Estado principal em `localStorage` (sessão, booking, appointments, payments, loyalty, subscriptions etc.).
- Funções globais e handlers dependem de IDs e seletores estáveis.

## Estratégia adotada para migração sem regressão
- Preservar integralmente `script.js` e `styles.css` em `public/`.
- Preservar marcação HTML original carregando body legacy dentro de páginas Next via componente `LegacyPage`.
- Reescritas (`*.html` -> rotas Next) para manter links existentes e `window.location.href` legados funcionando.
- App Router Next com `/app/login`, `/app/register`, `/app/client`, `/app/admin`, `/app/barber` e fallback `/app/[slug]` para todas as páginas legadas.
