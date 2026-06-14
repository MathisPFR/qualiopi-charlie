#!/usr/bin/env bash
# Redémarre proprement le serveur (corrige Internal Server Error / cache .next cassé)
set -e
cd "$(dirname "$0")/.."
echo "Arrêt du port 3000…"
fuser -k 3000/tcp 2>/dev/null || true
sleep 1
echo "Suppression du cache .next…"
rm -rf .next .next-build node_modules/.cache/next-build node_modules/.cache/next-dev
echo "Démarrage…"
exec bash scripts/dev.sh
