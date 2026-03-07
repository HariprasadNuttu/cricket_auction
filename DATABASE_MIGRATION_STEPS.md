# Database Migration Steps

The server is returning a 500 error because the database schema hasn't been updated with the new `AuctionLog` table and `isUndone` field.

## Steps to Fix:

### 1. Apply Database Schema Changes

Run this command inside the server Docker container:

```bash
docker-compose exec server npx prisma db push
```

This will:
- Create the `AuctionLog` table
- Add the `isUndone` field to `BidLog` table
- Update all relations

### 2. Regenerate Prisma Client (if needed)

If the above doesn't work, regenerate the Prisma client:

```bash
docker-compose exec server npx prisma generate
```

### 3. Restart Server

After migration, restart the server:

```bash
docker-compose restart server
```

## Alternative: If you want to reset and reseed

If you want to start fresh with the new schema:

```bash
# Reset database (WARNING: This deletes all data)
docker-compose exec server npx prisma migrate reset

# Or push schema without resetting
docker-compose exec server npx prisma db push

# Then seed the database
docker-compose exec server npx prisma db seed
```

## Verify Migration

After migration, verify the tables exist:

```bash
docker-compose exec server npx prisma studio
```

Or check via SQL:

```bash
docker-compose exec postgres psql -U postgres -d auction_db -c "\dt"
```

You should see:
- `AuctionLog` table
- `BidLog` table (with `isUndone` column)
