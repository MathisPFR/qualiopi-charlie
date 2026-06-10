#!/usr/bin/env bash
# Démarre toute la stack (app + Postgres + Gotenberg + Adminer) — aucun Node local requis.
set -e
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "→ Création de .env depuis .env.example"
  cp .env.example .env
fi

if [ ! -f config/client.json ]; then
  echo "→ Création de config/client.json depuis l'exemple"
  cp config/client.json.example config/client.json
fi

echo "→ Démarrage Docker Compose…"
docker compose up --build "$@"
