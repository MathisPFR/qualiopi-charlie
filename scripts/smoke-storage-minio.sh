#!/usr/bin/env bash
# Smoke test object-storage against MinIO (S3-compatible, same driver as R2 prod).
set -euo pipefail

cd "$(dirname "$0")/.."

if ! docker compose ps --status running minio 2>/dev/null | grep -q minio; then
  echo "Starting MinIO..."
  docker compose up -d minio minio-init
fi

echo "Running object-storage smoke test via MinIO (STORAGE_DRIVER=r2)..."
docker compose exec -T \
  -e STORAGE_DRIVER=r2 \
  -e R2_ENDPOINT=http://minio:9000 \
  -e R2_BUCKET=qualiopi-dev \
  -e R2_ACCESS_KEY_ID=minioadmin \
  -e R2_SECRET_ACCESS_KEY=minioadmin \
  -e R2_S3_FORCE_PATH_STYLE=true \
  app npx tsx scripts/smoke-object-storage.ts

echo "OK — browse objects at http://localhost:9001 (bucket qualiopi-dev)"
