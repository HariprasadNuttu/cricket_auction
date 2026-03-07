# Reset Database and Start Servers Script (PowerShell)

Write-Host "🔄 Resetting database and starting servers..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop containers
Write-Host "1️⃣ Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Step 2: Remove volumes (this deletes all data)
Write-Host ""
Write-Host "2️⃣ Removing database volumes..." -ForegroundColor Yellow
docker-compose down -v

# Step 3: Start containers
Write-Host ""
Write-Host "3️⃣ Starting containers..." -ForegroundColor Yellow
docker-compose up -d

# Step 4: Wait for database to be ready
Write-Host ""
Write-Host "4️⃣ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 5: Apply schema
Write-Host ""
Write-Host "5️⃣ Applying database schema..." -ForegroundColor Yellow
docker-compose exec -T server npx prisma db push --accept-data-loss

# Step 6: Generate Prisma client
Write-Host ""
Write-Host "6️⃣ Generating Prisma client..." -ForegroundColor Yellow
docker-compose exec -T server npx prisma generate

# Step 7: Seed database
Write-Host ""
Write-Host "7️⃣ Seeding database..." -ForegroundColor Yellow
docker-compose exec -T server npx prisma db seed

# Step 8: Restart server to ensure everything is loaded
Write-Host ""
Write-Host "8️⃣ Restarting server..." -ForegroundColor Yellow
docker-compose restart server

Write-Host ""
Write-Host "✅ Database reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Default Login Credentials:" -ForegroundColor Cyan
Write-Host "   Admin: admin@auction.com / admin123"
Write-Host "   Owner 1: owner1@auction.com / owner123"
Write-Host "   Owner 2: owner2@auction.com / owner123"
Write-Host "   Owner 3: owner3@auction.com / owner123"
Write-Host "   Owner 4: owner4@auction.com / owner123"
Write-Host "   Viewer: viewer@auction.com / viewer123"
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:4200" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Check logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f server"
Write-Host "   docker-compose logs -f client"
