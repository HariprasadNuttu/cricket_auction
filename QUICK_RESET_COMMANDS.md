# Quick Reset Commands

## For Windows PowerShell:

Copy and paste this entire block:

```powershell
# Stop and remove everything
docker-compose down -v

# Start containers
docker-compose up -d

# Wait for database
Start-Sleep -Seconds 15

# Apply schema
docker-compose exec -T server npx prisma db push --accept-data-loss

# Generate client
docker-compose exec -T server npx prisma generate

# Seed database
docker-compose exec -T server npx prisma db seed

# Restart server
docker-compose restart server

# Show status
docker-compose ps
```

---

## For Git Bash / WSL:

Copy and paste this entire block:

```bash
# Stop and remove everything
docker-compose down -v

# Start containers
docker-compose up -d

# Wait for database
sleep 15

# Apply schema
docker-compose exec -T server npx prisma db push --accept-data-loss

# Generate client
docker-compose exec -T server npx prisma generate

# Seed database
docker-compose exec -T server npx prisma db seed

# Restart server
docker-compose restart server

# Show status
docker-compose ps
```

---

## Verify Everything Works:

```bash
# Check containers
docker-compose ps

# Check server logs
docker-compose logs server --tail=20

# Test backend
curl http://localhost:3000/health

# Check database
docker-compose exec postgres psql -U postgres -d auction_db -c "SELECT COUNT(*) FROM \"Group\";"
```

---

## Access Application:

- **Frontend:** http://localhost:4200
- **Backend:** http://localhost:3000

**Login:**
- Admin: admin@auction.com / admin123
- Owner: owner1@auction.com / owner123

---

Done! 🎉
