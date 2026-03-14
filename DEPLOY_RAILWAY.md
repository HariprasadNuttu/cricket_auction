# Deploy to Railway

This guide covers deploying the Cricket Auction app in the format: **Node.js backend serving Angular from `public/`**.

## Prerequisites

- Railway account
- PostgreSQL database (Railway provides this)

---

## Step 1 — Database (Railway PostgreSQL)

1. Create a new **PostgreSQL** service in Railway.
2. Railway will set `DATABASE_URL` automatically when you add the database to your project.

---

## Step 2 — Environment Variables

In your Railway project, set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Auto-injected by Railway when you add PostgreSQL |
| `JWT_SECRET` | Secret for JWT tokens (e.g. a random string) |
| `PORT` | Railway sets this automatically |
| `CLIENT_ORIGIN` | Your app URL (e.g. `https://your-app.railway.app`) — optional when frontend is served from same origin |

---

## Step 3 — Build Angular (on your laptop)

```bash
cd client
npm install
ng build
```

Output: `client/dist/client/browser/` (contains `index.html`, `main-*.js`, etc.)

---

## Step 4 — Copy to Backend Public Folder

```bash
cd ../server
node scripts/copy-client.js
```

This copies `client/dist/client/browser/*` → `server/public/`.

**Or use the combined deploy script:**

```bash
cd server
npm run deploy:build
```

This runs: build client → copy to public → build server.

---

## Step 5 — Project Structure for Deploy

After build, your server folder should look like:

```
server/
  dist/           # Compiled Node.js (from tsc)
  public/         # Angular build (index.html, main.js, etc.)
  uploads/        # Player images (create if needed)
  package.json
  prisma/
  ...
```

---

## Step 6 — Database Setup, Migrations & Seed (Railway)

### Database connection

1. In Railway, create a **PostgreSQL** service (New → Database → PostgreSQL).
2. Link it to your app: open your app service → **Variables** → **Add Variable Reference** → select `DATABASE_URL` from the PostgreSQL service.
3. Prisma reads `DATABASE_URL` from the environment. No extra config needed.

### Schema (migrations)

This project uses **`prisma db push`** (schema sync, no migration files):

- **On every deploy**, `start.sh` runs `npx prisma db push --skip-generate` before starting the server.
- Tables are created/updated from `prisma/schema.prisma` automatically.
- No `prisma migrate` commands are required.

### Seed (initial data)

The seed is **not** run automatically on deploy. Run it manually after the first deploy:

**Option A — Railway CLI (recommended)**

```bash
# Install Railway CLI: https://docs.railway.app/develop/cli
railway login
railway link   # Link to your project
cd server
railway run npx prisma db seed
```

**Option B — One-off run from your machine**

```bash
cd server
# Set DATABASE_URL to your Railway Postgres URL (from Railway dashboard)
$env:DATABASE_URL="postgresql://user:pass@host:port/railway"   # PowerShell
npx prisma db seed
```

**Option C — Add seed to deploy (first deploy only)**

To seed automatically on first deploy, you can add it to `start.sh`:

```bash
# In start.sh, before exec node:
npx prisma db push --skip-generate || true
npx prisma db seed || true   # Add this line (|| true so it doesn't fail on re-deploy)
exec node dist/index.js
```

**Warning:** The seed script **clears all data** and re-creates it. Running it on every deploy would reset production. Use Option C only for initial setup, then remove it.

### Summary

| Task        | When                    | How                                      |
|------------|-------------------------|------------------------------------------|
| Connect DB | One-time                | Add PostgreSQL, link `DATABASE_URL`     |
| Schema     | Every deploy            | Automatic via `prisma db push` in start.sh |
| Seed       | Once after first deploy | `railway run npx prisma db seed`         |

---

## Step 7 — Railway Deploy

1. Connect your repo to Railway.
2. **Root Directory**: leave as `.` (repo root).
3. Add PostgreSQL service and link it to your app (Railway injects `DATABASE_URL`).
4. Set **Region** to `asia-southeast1` in Project Settings if desired.
5. Deploy — Railway runs `start.sh` which:
   - Installs deps, runs `prisma generate`
   - Builds Angular → copies to `public/` → builds server
   - Runs `prisma db push` (schema sync)
   - Starts `node dist/index.js`

**Note:** The server uses `process.env.PORT` (Railway injects this).

---

## Step 8 — WebSocket Keep-Alive (Railway)

Railway’s proxy may close idle WebSocket connections after ~30–60 seconds. The app is configured to prevent this:

| Setting | Value | Purpose |
|---------|-------|---------|
| `keepAliveTimeout` | 65000 ms | Prevents HTTP server from closing idle connections early |
| `headersTimeout` | 66000 ms | Must be > keepAliveTimeout |
| `pingInterval` | 25000 ms | Socket.IO sends ping every 25 seconds |
| `pingTimeout` | 60000 ms | Disconnect if no pong within 60 seconds |

**CORS:** Set `CLIENT_ORIGIN` to your Railway URL (e.g. `https://your-app.up.railway.app`) if the frontend is served from a different domain. When Angular is served from the same origin (built into `public/`), this is optional.

**Test after deploy:** Open browser DevTools → Network → WS tab and verify the WebSocket stays connected without "closed unexpectedly" errors.

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `cd client && ng build` | Build Angular |
| `cd server && node scripts/copy-client.js` | Copy build to public |
| `cd server && npm run deploy:build` | Build client + copy + build server |
| `cd server && npm start` | Start server (serves API + Angular from `/`) |
