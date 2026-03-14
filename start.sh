#!/bin/bash
set -e
cd server
npm install
npx prisma generate
npm run deploy:build
npx prisma db push --skip-generate || true
npx prisma db seed || true
exec node dist/index.js
