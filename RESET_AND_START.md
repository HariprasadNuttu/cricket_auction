# Reset Database and Start Servers - Step by Step Guide

## 🚀 Complete Reset Process

Follow these steps to drop the database and start fresh:

---

## Step 1: Stop and Remove Containers (Deletes All Data)

```bash
docker-compose down -v
```

This will:
- Stop all containers
- Remove containers
- Remove volumes (deletes all database data)

---

## Step 2: Start Containers

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Backend server
- Frontend client (Nginx)

---

## Step 3: Wait for Database to be Ready

Wait about 10-15 seconds for PostgreSQL to fully start.

```bash
# Check if database is ready
docker-compose exec postgres pg_isready -U postgres
```

---

## Step 4: Apply Database Schema

```bash
docker-compose exec server npx prisma db push --accept-data-loss
```

This creates all tables with the new multi-tenant structure.

---

## Step 5: Generate Prisma Client

```bash
docker-compose exec server npx prisma generate
```

This generates the Prisma client with all new models.

---

## Step 6: Seed Database

```bash
docker-compose exec server npx prisma db seed
```

This creates:
- Default Group: "Bhimavaram Cricket League"
- Default Season: "2026 Season"
- 4 Teams with owners
- 50 Players
- Admin and viewer users

---

## Step 7: Restart Server

```bash
docker-compose restart server
```

This ensures the server picks up all changes.

---

## Step 8: Verify Everything is Running

```bash
# Check container status
docker-compose ps

# Check server logs
docker-compose logs server --tail=50

# Check client logs
docker-compose logs client --tail=50
```

---

## 🎯 Quick One-Liner (PowerShell)

Run this in PowerShell:

```powershell
docker-compose down -v; docker-compose up -d; Start-Sleep -Seconds 15; docker-compose exec -T server npx prisma db push --accept-data-loss; docker-compose exec -T server npx prisma generate; docker-compose exec -T server npx prisma db seed; docker-compose restart server
```

---

## 🎯 Quick One-Liner (Bash)

Run this in Git Bash or WSL:

```bash
docker-compose down -v && docker-compose up -d && sleep 15 && docker-compose exec -T server npx prisma db push --accept-data-loss && docker-compose exec -T server npx prisma generate && docker-compose exec -T server npx prisma db seed && docker-compose restart server
```

---

## 📋 What Gets Created

After seeding, you'll have:

### Group
- **Name:** Bhimavaram Cricket League
- **ID:** 1

### Season
- **Name:** 2026 Season
- **ID:** 1
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

## 🔍 Verify Database

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d auction_db

# Check tables
\dt

# Check groups
SELECT * FROM "Group";

# Check seasons
SELECT * FROM "Season";

# Check players
SELECT COUNT(*) FROM "Player";

# Check season players
SELECT COUNT(*) FROM "SeasonPlayer";

# Exit
\q
```

---

## 🌐 Access the Application

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## 🐛 Troubleshooting

### Database not ready
```bash
# Wait longer and check
docker-compose exec postgres pg_isready -U postgres
```

### Schema push fails
```bash
# Try resetting Prisma
docker-compose exec server npx prisma migrate reset
```

### Seed fails
```bash
# Check logs
docker-compose logs server | grep -i error

# Try seeding manually
docker-compose exec server npx prisma db seed
```

### Containers not starting
```bash
# Check logs
docker-compose logs

# Rebuild if needed
docker-compose up -d --build
```

---

## ✅ Success Indicators

You'll know it worked when:

1. ✅ Containers are running: `docker-compose ps` shows all containers as "Up"
2. ✅ Database has tables: `\dt` shows Group, Season, Player, etc.
3. ✅ Seed data exists: Groups and Seasons queries return data
4. ✅ Server logs show no errors
5. ✅ Frontend loads at http://localhost:4200
6. ✅ Backend responds at http://localhost:3000/health

---

## 📝 Next Steps After Reset

1. **Login as Admin:**
   - Email: admin@auction.com
   - Password: admin123

2. **Access Dashboard:**
   - You'll see the default Group and Season
   - 50 players ready for auction
   - 4 teams created

3. **Start Auction:**
   - Select season
   - Click "Start Next Random Player"
   - Begin bidding!

---

All set! Run the commands above to reset and start fresh. 🚀
