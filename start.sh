#!/usr/bin/env bash
# Production container START — must listen on PORT within ~60s or Railway shows "Application failed to respond".
# Full Angular + server compile runs in BUILD (nixpacks.toml / `npm run build`), not here.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/server"

if [ ! -f dist/index.js ]; then
  echo "ERROR: dist/index.js missing. The image build must run first (e.g. nixpacks [phases.build] or: npm run build)."
  exit 1
fi
if [ ! -f public/index.html ]; then
  echo "ERROR: public/index.html missing. Run client build + copy:client during image build (npm run deploy:build from server/)."
  exit 1
fi

npx prisma generate
npx prisma db push --skip-generate || true
exec node dist/index.js
