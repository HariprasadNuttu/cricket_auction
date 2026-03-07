# Database Migration Guide - Multi-Tenant System

## ⚠️ IMPORTANT: This is a Breaking Change

The new schema introduces a multi-tenant structure. You'll need to migrate existing data.

## Step 1: Backup Current Database

```bash
# Backup PostgreSQL database
docker-compose exec postgres pg_dump -U postgres auction_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Step 2: Create Migration Script

Create a migration script to:
1. Create new tables (Group, Season, SeasonPlayer)
2. Migrate existing data
3. Update foreign keys

## Step 3: Run Migration

### Option A: Fresh Start (Recommended for Development)

```bash
# Reset database
docker-compose exec server npx prisma migrate reset

# This will:
# - Drop all tables
# - Create new schema
# - Run seed script (you'll need to update seed.ts)
```

### Option B: Data Migration (For Production)

1. **Create default Group:**
   ```sql
   INSERT INTO "Group" (name, "createdById", "createdAt", "updatedAt")
   VALUES ('Default Cricket League', 1, NOW(), NOW())
   RETURNING id;
   ```

2. **Create default Season:**
   ```sql
   INSERT INTO "Season" ("groupId", name, year, status, "auctionStarted", "createdAt", "updatedAt")
   VALUES (1, 'Default Season', 2026, 'DRAFT', false, NOW(), NOW())
   RETURNING id;
   ```

3. **Link Players to Group:**
   ```sql
   UPDATE "Player" SET "groupId" = 1 WHERE "groupId" IS NULL;
   ```

4. **Create SeasonPlayer entries:**
   ```sql
   INSERT INTO "SeasonPlayer" ("seasonId", "playerId", status, "createdAt", "updatedAt")
   SELECT 1, id, status, NOW(), NOW() FROM "Player";
   ```

5. **Link Teams to Season:**
   ```sql
   UPDATE "Team" SET "seasonId" = 1 WHERE "seasonId" IS NULL;
   ```

6. **Update AuctionState:**
   ```sql
   UPDATE "AuctionState" SET "seasonId" = 1 WHERE "seasonId" IS NULL;
   ```

7. **Update BidLog:**
   ```sql
   UPDATE "BidLog" SET "seasonId" = 1 WHERE "seasonId" IS NULL;
   ```

8. **Update AuctionLog:**
   ```sql
   UPDATE "AuctionLog" SET "seasonId" = 1 WHERE "seasonId" IS NULL;
   ```

## Step 4: Update Seed Script

Update `server/prisma/seed.ts` to create:
- A default Group
- A default Season
- Players linked to Group
- SeasonPlayer entries
- Teams linked to Season

## Step 5: Regenerate Prisma Client

```bash
docker-compose exec server npx prisma generate
```

## Step 6: Restart Services

```bash
docker-compose restart server
```

## Verification

After migration, verify:

```bash
# Check tables exist
docker-compose exec postgres psql -U postgres -d auction_db -c "\dt"

# Check Group exists
docker-compose exec postgres psql -U postgres -d auction_db -c "SELECT * FROM \"Group\";"

# Check Season exists
docker-compose exec postgres psql -U postgres -d auction_db -c "SELECT * FROM \"Season\";"

# Check Players linked to Group
docker-compose exec postgres psql -U postgres -d auction_db -c "SELECT id, name, \"groupId\" FROM \"Player\" LIMIT 5;"
```

## Rollback Plan

If migration fails:

```bash
# Restore backup
docker-compose exec -T postgres psql -U postgres auction_db < backup_YYYYMMDD_HHMMSS.sql

# Or reset to old schema
git checkout HEAD -- server/prisma/schema.prisma
docker-compose exec server npx prisma db push
```
