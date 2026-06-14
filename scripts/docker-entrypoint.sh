#!/bin/sh
set -e
cd /app

LOCK_SHA=""
if [ -f package-lock.json ]; then
  LOCK_SHA=$(sha256sum package-lock.json | awk '{print $1}')
fi

needs_install=0
if [ ! -d node_modules/next ]; then
  needs_install=1
elif [ -n "$LOCK_SHA" ] && [ ! -f node_modules/.package-lock.sha ]; then
  needs_install=1
elif [ -n "$LOCK_SHA" ] && [ "$(cat node_modules/.package-lock.sha 2>/dev/null)" != "$LOCK_SHA" ]; then
  needs_install=1
fi

if [ "$needs_install" -eq 1 ]; then
  echo "→ Installation des dépendances npm…"
  npm ci --legacy-peer-deps
  if [ -n "$LOCK_SHA" ]; then
    echo "$LOCK_SHA" > node_modules/.package-lock.sha
  fi
fi

echo "→ Prisma generate…"
npx prisma generate

echo "→ Synchronisation du schéma BDD…"
npx prisma db push --skip-generate

exec "$@"
