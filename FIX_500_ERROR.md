# Fix 500 Internal Server Error

## Problem
The `/api/auction/state` endpoint is returning a 500 error because the database schema hasn't been updated with the new `AuctionLog` table and `isUndone` field in `BidLog`.

## Solution

### Step 1: Update Database Schema

Run this command to push the schema changes to the database:

```bash
docker-compose exec server npx prisma db push
```

This will:
- Create the `AuctionLog` table
- Add `isUndone` column to `BidLog` table
- Update all relations

### Step 2: Regenerate Prisma Client

After pushing the schema, regenerate the Prisma client:

```bash
docker-compose exec server npx prisma generate
```

### Step 3: Restart Server

Restart the server to ensure it picks up the changes:

```bash
docker-compose restart server
```

## Alternative: If you want to reset everything

If you want to start fresh (WARNING: This deletes all data):

```bash
# Reset database and apply schema
docker-compose exec server npx prisma migrate reset

# Seed the database
docker-compose exec server npx prisma db seed
```

## Verify Fix

After migration, check the server logs:

```bash
docker-compose logs server --tail=50
```

Then try accessing the dashboard again. The 500 error should be resolved.

## If Error Persists

If you still get errors, check:

1. **Database connection:**
   ```bash
   docker-compose exec postgres psql -U postgres -d auction_db -c "\dt"
   ```
   You should see `AuctionLog` and `BidLog` tables.

2. **Prisma client:**
   ```bash
   docker-compose exec server ls -la node_modules/.prisma/client/
   ```

3. **Server logs for specific error:**
   ```bash
   docker-compose logs server | grep -i error
   ```
