# Kitobchi

Used-book classifieds for Uzbekistan (launch city: Tashkent). Buyers and
sellers find each other on the platform; the handover and payment happen
offline, in person. See the brief this repo was built from for full product
context — this README covers running the code.

## Stack

- **API** (`api/`): NestJS + TypeScript, REST, versioned under `/api/v1`.
  PostgreSQL via Prisma (driver-adapter based — Prisma 7), Redis for OTP
  storage, Meilisearch (wired in Phase 2), S3-compatible storage (MinIO) for
  listing images, phone + SMS OTP auth (Eskiz.uz) with JWT access/refresh
  tokens.
- **Web** (`web/`): Next.js App Router + TypeScript + Tailwind CSS v4.
  Server-rendered pages for SEO, calling the API directly.
- **Infra**: `docker-compose.yml` runs Postgres, Redis, Meilisearch, and
  MinIO for local dev.

## Prerequisites

- Node.js 24+
- Docker Desktop (for Postgres/Redis/Meilisearch/MinIO)

## First-time setup

```bash
# 1. Start infra (Postgres, Redis, Meilisearch, MinIO)
docker compose up -d

# 2. API
cd api
cp .env.example .env   # already done in this checkout; edit if needed
npm install
npx prisma migrate dev --name init   # creates tables
npx prisma db seed                   # seeds starter categories
npm run start:dev                    # http://localhost:3001/api/v1

# 3. Web (separate terminal)
cd web
cp .env.example .env
npm install
npm run dev                          # http://localhost:3000
```

The API's Swagger-free error shape is consistent JSON:
`{ "error": { "code": "...", "message": "..." } }`.

### SMS OTP in local dev

If `ESKIZ_EMAIL`/`ESKIZ_PASSWORD` are not set in `api/.env`, the API falls
back to a console SMS provider — the OTP code is logged to the API's stdout
instead of being sent as a real SMS, so the login flow is testable without a
real Eskiz.uz account.

## Project layout

```
api/                  NestJS backend (modular monolith)
  src/
    auth/              phone OTP + JWT, pluggable SmsProvider (Eskiz/console)
    catalog/           categories + books, ISBN lookup (Open Library fallback)
    listings/          listing CRUD, image upload
    users/             profile + public seller profile
    storage/           S3/MinIO upload
    redis/             Redis client (OTP storage)
    prisma/            PrismaService (driver-adapter based, see below)
    common/            guards, decorators, global exception filter
  prisma/
    schema.prisma      MVP data model
    seed.ts            starter categories
  prisma.config.ts     Prisma 7 config (datasource URL + seed command)

web/                  Next.js frontend
  src/
    app/               home, search, book/[id], listings/[id], listings/new,
                       login, sellers/[id]
    components/        listing-card, header, footer, badges, etc.
    lib/               API client, server-side query helpers, types

docker-compose.yml     Postgres, Redis, Meilisearch, MinIO
.github/workflows/     CI (lint, build, test for both apps)
```

## Notable implementation details

- **Prisma 7 driver adapters**: this Prisma version removed `url` from
  `schema.prisma`; the connection now goes through `@prisma/adapter-pg` at
  runtime (`PrismaService`) and through `prisma.config.ts` for the CLI
  (migrate/seed/studio). Both read `DATABASE_URL` from `.env`.
- **Auth** is phone + SMS OTP (not email/password), matching the brief's
  mobile-first requirement. Access tokens are short-lived (15m), refresh
  tokens long-lived (30d) — both stateless JWTs with a `type` claim so one
  can't be used as the other.
- **ISBN lookup** (`GET /api/v1/books/lookup?isbn=`) checks the local DB
  first, then falls back to the Open Library API for autofill data. The
  actual `Book` row is only created when a listing is submitted.
- **Payment/delivery are intentionally not implemented** — out of MVP scope
  per the brief. The `type` (SALE/DONATION) and `status` fields on `Listing`
  are the only transaction-adjacent state; there's no `orders` table yet.

## What's next (Phase 2+, not yet built)

- Meilisearch indexing + search-backed `/listings` query (currently plain
  Postgres `contains` filtering)
- In-site chat (`conversations`/`messages` tables exist in the schema but
  have no API yet)
- Favorites, notifications (SMS + in-app), reviews/ratings enforcement
- Admin panel + moderation queue
- BullMQ job processing (search indexing, notification delivery) — package
  is installed but not wired up yet
