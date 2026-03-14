#!/bin/bash
# set -e
# cd server
# npm install
# npx prisma generate
# npm run deploy:build
# npx prisma db push --skip-generate || true
# exec node dist/index.js
#!/bin/bash
set -e
cd server
npx prisma db seed
exec node dist/index.js