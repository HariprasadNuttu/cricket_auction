#!/bin/bash
set -e
cd server
npm install
npx prisma generate
npm run deploy:build
npx prisma db push --skip-generate || true
# Seed runs ONCE manually after first deploy - NOT on every deploy (would wipe data)
# Run: railway run npx prisma db seed
exec node dist/index.js
