#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
NODE=$(command -v node 2>/dev/null | grep -v '/mnt/c/' | head -1)
NODE=${NODE:-/home/freem/.cursor-server/bin/81fcf2931d7687b4ff3f3017858d0c6dee7e2a60/node}
exec "$NODE" node_modules/prisma/build/index.js db push "$@"
