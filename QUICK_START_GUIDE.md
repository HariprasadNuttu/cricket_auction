# Quick Start Guide - Multi-Tenant Auction System

## 🚀 Setup Steps

### Step 1: Install Dependencies
```bash
docker-compose exec server npm install
```

This installs:
- `csv-parse` - For CSV file parsing
- `multer` - For file uploads
- `@types/multer` - TypeScript types

### Step 2: Apply Database Schema

**Option A: Fresh Start (Recommended for Development)**
```bash
docker-compose exec server npx prisma migrate reset
```
This will:
- Drop all tables
- Create new schema
- Run seed script automatically

**Option B: Migrate Existing Data**
```bash
# Push schema
docker-compose exec server npx prisma db push

# Run migration script
docker-compose exec server npm run migrate:multi-tenant
```

### Step 3: Regenerate Prisma Client
```bash
docker-compose exec server npx prisma generate
```

### Step 4: Restart Services
```bash
docker-compose restart server
```

---

## 📋 Default Data Created

After seeding, you'll have:

### Group
- **Name:** Bhimavaram Cricket League
- **ID:** 1

### Season
- **Name:** 2026 Season
- **ID:** 1
- **Group ID:** 1
- **Status:** DRAFT

### Teams (4)
1. Mumbai Indians (Owner: Ravi Kumar)
2. Chennai Super Kings (Owner: Suresh Reddy)
3. Royal Challengers (Owner: Kiran Sharma)
4. Delhi Capitals (Owner: Priya Patel)

### Players (50)
- 10 Batsmen
- 10 Bowlers
- 10 All-rounders
- 10 Wicket Keepers
- All linked to Group and Season

### Users
- **Admin:** admin@auction.com / admin123
- **Owners:** owner1@auction.com through owner4@auction.com / owner123
- **Viewer:** viewer@auction.com / viewer123

---

## 🧪 Testing the APIs

### 1. Get Groups
```bash
curl -X GET http://localhost:3000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get Seasons in Group
```bash
curl -X GET http://localhost:3000/api/groups/1/seasons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Auction State (for season)
```bash
curl -X GET http://localhost:3000/api/auction/seasons/1/state \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Upload Players CSV
```bash
curl -X POST http://localhost:3000/api/groups/1/players/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@players.csv"
```

**CSV Format:**
```csv
name,category,basePrice,country
Virat Kohli,BATSMAN,5000,India
Rohit Sharma,BATSMAN,5000,India
```

### 5. Add Players to Season
```bash
curl -X POST http://localhost:3000/api/seasons/1/players \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"playerIds": [1, 2, 3, 4, 5]}'
```

### 6. Start Random Auction
```bash
curl -X POST http://localhost:3000/api/auction/seasons/1/start-random \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Migration from Old System

If you have existing data:

1. **Backup database:**
   ```bash
   docker-compose exec postgres pg_dump -U postgres auction_db > backup.sql
   ```

2. **Push new schema:**
   ```bash
   docker-compose exec server npx prisma db push
   ```

3. **Run migration script:**
   ```bash
   docker-compose exec server npm run migrate:multi-tenant
   ```

4. **Verify migration:**
   ```bash
   docker-compose exec postgres psql -U postgres -d auction_db -c "SELECT * FROM \"Group\";"
   docker-compose exec postgres psql -U postgres -d auction_db -c "SELECT * FROM \"Season\";"
   ```

---

## ⚠️ Important Notes

1. **Breaking Changes:**
   - All auction endpoints now require `seasonId`
   - Socket events require `seasonId` in payload
   - Frontend needs updates to select group/season

2. **Database Schema:**
   - `AuctionState` is now per-season (not global)
   - `Team` belongs to `Season` (not global)
   - `Player` belongs to `Group` (reusable across seasons)

3. **Frontend Updates Needed:**
   - Add group/season selector
   - Update API calls to include `seasonId`
   - Update socket events to include `seasonId`
   - Update dashboard to work with `SeasonPlayer`

---

## 📚 API Documentation

See `IMPLEMENTATION_COMPLETE.md` for full API documentation.

---

## 🐛 Troubleshooting

### Error: "Table does not exist"
- Run `npx prisma db push` to create tables

### Error: "Relation does not exist"
- Run `npx prisma generate` to regenerate client

### Error: "Foreign key constraint"
- Ensure you've run the migration script
- Check that Group and Season exist before creating related data

### Socket errors
- Ensure `seasonId` is included in `PLACE_BID` event
- Verify team belongs to the season

---

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Database schema applied
- [ ] Migration script run (if migrating)
- [ ] Seed script run
- [ ] Prisma client regenerated
- [ ] Server restarted
- [ ] Groups API working
- [ ] Seasons API working
- [ ] Players API working
- [ ] Auction API working (with seasonId)

---

All implementation is complete! 🎉
