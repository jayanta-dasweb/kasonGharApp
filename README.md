# Kason Ghar (কছন ঘৰ)

ERP, consignment, inventory & accounting for Assamese Mekhela Chador (মেখেলা চাদৰ) — Expo + TypeScript + Supabase. Brand copy uses Assamese script only (no Hindi/Devanagari).

## Setup

1. Copy `.env.example` → `.env` and set your real Supabase URL + publishable key.
2. `npm install`
3. `npm start`

Login: 10-digit phone → auth email `{phone}@kasonghar.local`.

Default super admin (seeded in DB): `7002911685` / `SUPERadmin@123`

## Architecture

- `app/` — Expo Router screens (auth, dashboard, catalog, masters, inventory, sales, reports, RBAC)
- `services/` — Supabase mutations (no mock data)
- `lib/` — auth context, supabase client, formatters
- `__tests__/` — Jest integration tests for DB insert, stock moves, RBAC

## Tests

```bash
npm test
```

Live DB tests run when `EXPO_PUBLIC_SUPABASE_URL` is set (not the placeholder).

## Remote

https://github.com/jayanta-dasweb/kasonGharApp.git
