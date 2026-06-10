#!/bin/sh
set -e
cd /app

if [ ! -d node_modules/next ]; then
  echo "→ Installation des dépendances npm…"
  npm ci --legacy-peer-deps
fi

echo "→ Prisma generate…"
npx prisma generate

echo "→ Synchronisation du schéma BDD…"
npx prisma db push --skip-generate

exec "$@"
