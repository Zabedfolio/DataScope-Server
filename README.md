# DataScope Server — High-Throughput Stream Indexing API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-yellow.svg)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase_Dual_Pooler-336791.svg)](https://supabase.com/)

High-performance backend API service for **DataScope**, providing server-side indexed queries, multi-column sorting, flat-memory streaming exports, and analytics aggregations across **100,000+ records**.

---

## Architecture & Endpoints

- **`GET /api/records`**: Multi-predicate query engine with B-Tree index acceleration (`status`, `service`, `latency`, `created_at`).
  - Supports multi-column sorting: `?sortRules=service:asc,latency:desc`.
  - Supports text search, pagination (`page`, `pageSize`), and dataset clearance checks.
- **`GET /api/records/export`**: Flat-memory CSV streaming endpoint utilizing Node.js pipelines to stream up to 50,000 rows without memory spikes (< 15MB RSS).
- **`GET /api/analytics`**: SQL aggregations (`COUNT`, `AVG`, `GROUP BY`) power real-time dashboard telemetry.
- **`GET /api/views` / `POST /api/views`**: Persistent team-shared and private query preset catalog.
- **`GET /api/health`**: Service and database connectivity ping.

---

## Database & Seeding

The database is powered by **Supabase PostgreSQL** with composite and B-Tree indexes:
```bash
# Seed 100,000+ records in parallel chunks
npm run db:seed:100k

# Run migrations
npm run db:migrate
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Server runs on `http://localhost:5000` (or configured `PORT`).
