# SwiftShip Logistics

Professional logistics web app built with **TanStack Start (React 19)**, **Vite**, **Tailwind CSS v4**, **better-auth**, **Kysely**, and **PGlite / Postgres**.

Public marketing site, ship/quote/checkout flows, public tracking, customer account area, and an admin operations desk — without impersonating FedEx, UPS, DHL, or any other carrier brand.

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TanStack Router / Start |
| Styling | Tailwind CSS v4 (design tokens in `src/styles.css`) |
| Auth | better-auth (Grok broker / email-password flag) |
| DB | PGlite embedded Postgres (default) or `DATABASE_URL` Postgres |
| SQL | Tagged-template SQL via `getSql()` + Kysely dialect for auth |

## Quick start

```bash
npm install
npm run dev
```

App listens on `http://0.0.0.0:8080`.

```bash
npm run build      # production build + migrations
npm run typecheck  # tsc --noEmit
npm run db:migrate # apply pending SQL migrations
```

Scripts wrap Vite with `scripts/with-app-env.mjs` so `.grok/app-env.json` `VITE_*` flags stay consistent across dev/build/preview.

## Environment

Copy `.env.example` to `.env` (or rely on platform injection). Important keys:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. **Unset** → embedded PGlite (preview/dev). |
| `VITE_AUTH_ENABLED` | `"false"` disables auth UI (dev user). Deployer typically sets `"true"`. |
| `BETTER_AUTH_URL` | Public origin for Better Auth callbacks. |
| `BETTER_AUTH_SECRET` | Session signing secret (required in production). |
| `GROK_AUTH_ISSUER` / `GROK_AUTH_CLIENT_ID` / `GROK_AUTH_CLIENT_SECRET` | Federated sign-in broker (optional in preview). |
| `GROK_PROJECT_ID` | Set on deploy; absence marks workspace preview mode. |

Never commit real secrets. Payments remain **demo/stub** — only card **last4** is stored.

## Database & migrations

Migrations live in `migrations/` and run through `npm run db:migrate` (also on `npm run build`).

| File | Role |
| --- | --- |
| `0001_auth.sql` | Better Auth tables |
| `0002_schema.sql` | Profiles, shipments, events, payments, locations, … |
| `0003_seed.sql` | Service catalog + facility locations |
| `0004_go_live.sql` | Clears demo shipments on go-live |
| `0005_ops_upgrade.sql` | Audit log, delivery prefs, inbox status, shipment notes |

Additive only — do not rewrite 0001–0004 unless broken.

## Demo / staff access

1. Register or sign in.
2. If no admin exists yet, open **Account** and use **Activate staff access** (first admin claim).
3. Or promote a user from **Admin → Staff & customers**.

**There are no hard-coded demo passwords.** After claiming admin:

- Use **Seed DEMO shipments** on the ops overview (clearly labeled `is_demo`).
- DEMO shipments show banners on tracking; they are not live carrier traffic.

Change any temporary credentials you create. Do not reuse preview secrets in production.

## Product map

- **Marketing:** `/`, `/services`, `/pricing`, `/freight`, `/business`, `/about`, `/help`, `/contact`, `/locations`, `/returns`
- **Flows:** `/ship`, `/quote`, `/checkout`
- **Tracking:** `/track`, `/track/$trackingNumber` (share + print)
- **Account:** shipments (CSV export, packing slip), addresses, billing (last4 only), notifications, delivery prefs, settings
- **Admin:** KPIs, shipments (bulk status), create, payments, locations, inbox, customers (deep-link), activity log, DEMO seed

## Honesty

- SwiftShip is a **fictional / demo logistics brand** for this codebase.
- Tracking numbers use the `SWF…` prefix — not a real carrier format.
- Checkout payments are stubbed; no live processor keys required.
- Full PANs are never stored.

## License

Private application package — all rights reserved by the project owner unless otherwise noted.
