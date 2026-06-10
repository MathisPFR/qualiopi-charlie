#!/usr/bin/env bash
# Shell dans le conteneur app (Node 22 — utile pour BMAD, Prisma, etc.)
set -e
cd "$(dirname "$0")/.."
docker compose exec app bash "$@"
