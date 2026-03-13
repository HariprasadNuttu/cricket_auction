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

## Step 6 — Database Connection

Prisma uses `DATABASE_URL` from the environment. Railway injects this when you add PostgreSQL.

Ensure your `prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run migrations before first deploy:

```bash
cd server
npx prisma migrate deploy
npx prisma db seed   # Optional: seed data
```

---

## Step 7 — Railway Deploy

1. Connect your repo to Railway.
2. **Root Directory**: leave as `.` (repo root). Railpack detects the root `package.json` and `nixpacks.toml`.
3. Add PostgreSQL service and link it to your app (Railway injects `DATABASE_URL`).
4. Set **Region** to `asia-southeast1` in Project Settings if desired.
5. Deploy — Railpack will:
   - Install server deps
   - Run `prisma generate`
   - Build Angular → copy to `public/` → build server
   - Start with `prisma db push` (schema sync) then `node dist/index.js`

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `cd client && ng build` | Build Angular |
| `cd server && node scripts/copy-client.js` | Copy build to public |
| `cd server && npm run deploy:build` | Build client + copy + build server |
| `cd server && npm start` | Start server (serves API + Angular from `/`) |
