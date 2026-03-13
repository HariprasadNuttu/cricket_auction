# Cricket Auction System

## Local Setup

### 1. Database (one-time)

Create the database and user (run from `server/`):

```bash
psql -U postgres -f scripts/create-db.sql
```

This creates user `auction` with password `auction123` and database `auction_db`.

`server/.env` is already configured with these credentials.

### 2. Install & setup (one-time)

```bash
npm install
npm run db:setup
cd client && npm install
```

### 3. Migrations & seed

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Push schema + seed (local first-time or schema changes) |
| `npm run db:seed` | Run seed only (66 players, teams, admin, etc.) |
| `npm run db:migrate` | Apply migrations (production; use after `prisma migrate dev`) |
| `npm run db:reset` | Wipe DB, push schema, re-seed (destructive) |

**Note:** This project uses `prisma db push` for schema sync (no migration files). For production with migrations, run `npx prisma migrate dev --name init` once to create migrations, then use `npm run db:migrate` for deploys.

### 4. Start (local dev)

From project root:

```bash
npm run dev
```

This starts both server and client. Or run separately:

```bash
npm run dev:server   # API at http://localhost:3000
npm run dev:client   # App at http://localhost:4200
```

**App:** http://localhost:4200  
**API:** http://localhost:3000  

**Login:** admin@auction.com / admin123 (after seed)
