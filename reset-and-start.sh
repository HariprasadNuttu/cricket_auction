#!/bin/bash

# Reset Database and Start Servers Script

echo "🔄 Resetting database and starting servers..."
echo ""

# Step 1: Stop containers
echo "1️⃣ Stopping containers..."
docker-compose down

# Step 2: Remove volumes (this deletes all data)
echo ""
echo "2️⃣ Removing database volumes..."
docker-compose down -v

# Step 3: Start containers
echo ""
echo "3️⃣ Starting containers..."
docker-compose up -d

# Step 4: Wait for database to be ready
echo ""
echo "4️⃣ Waiting for database to be ready..."
sleep 10

# Step 5: Apply schema
echo ""
echo "5️⃣ Applying database schema..."
docker-compose exec -T server npx prisma db push --accept-data-loss

# Step 6: Generate Prisma client
echo ""
echo "6️⃣ Generating Prisma client..."
docker-compose exec -T server npx prisma generate

# Step 7: Seed database
echo ""
echo "7️⃣ Seeding database..."
docker-compose exec -T server npx prisma db seed

# Step 8: Restart server to ensure everything is loaded
echo ""
echo "8️⃣ Restarting server..."
docker-compose restart server

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📋 Default Login Credentials:"
echo "   Admin: admin@auction.com / admin123"
echo "   Owner 1: owner1@auction.com / owner123"
echo "   Owner 2: owner2@auction.com / owner123"
echo "   Owner 3: owner3@auction.com / owner123"
echo "   Owner 4: owner4@auction.com / owner123"
echo "   Viewer: viewer@auction.com / viewer123"
echo ""
echo "🌐 Frontend: http://localhost:4200"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "📊 Check logs:"
echo "   docker-compose logs -f server"
echo "   docker-compose logs -f client"
