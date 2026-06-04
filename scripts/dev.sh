#!/usr/bin/env bash
# Démarre Next.js avec Node Linux (évite npm Windows + chemins UNC WSL)
set -e
cd "$(dirname "$0")/.."

pick_node() {
  if command -v node >/dev/null 2>&1; then
    local n
    n=$(command -v node)
    if [[ "$n" != /mnt/c/* ]]; then
      echo "$n"
      return
    fi
  fi
  if [ -x "/home/freem/.cursor-server/bin/81fcf2931d7687b4ff3f3017858d0c6dee7e2a60/node" ]; then
    echo "/home/freem/.cursor-server/bin/81fcf2931d7687b4ff3f3017858d0c6dee7e2a60/node"
    return
  fi
  echo "Node.js introuvable. Installez-le dans WSL : sudo apt install -y nodejs npm" >&2
  exit 1
}

NODE=$(pick_node)
echo "→ Node: $NODE"
echo "→ http://localhost:3000"
exec "$NODE" node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 3000
