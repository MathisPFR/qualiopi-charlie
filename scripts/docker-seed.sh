#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
docker compose exec app node prisma/seed.mjs
