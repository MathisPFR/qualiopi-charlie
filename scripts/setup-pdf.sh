#!/usr/bin/env bash
# Installe les dépendances pour la conversion PDF (Puppeteer + Chrome)
set -e
cd "$(dirname "$0")/.."
NODE=$(command -v node 2>/dev/null | grep -v '/mnt/c/' | head -1)
NODE=${NODE:-/home/freem/.cursor-server/bin/81fcf2931d7687b4ff3f3017858d0c6dee7e2a60/node}

echo "1) Installez LibreOffice (recommandé) :"
echo "   sudo apt install -y libreoffice"
echo ""
echo "2) Dépendances Node…"
npm install mammoth puppeteer --legacy-peer-deps 2>/dev/null || true

echo "3) Chrome Puppeteer (secours si pas LibreOffice)…"
"$NODE" node_modules/puppeteer/lib/esm/puppeteer/node/cli.js browsers install chrome 2>/dev/null || true

echo "4) Test…"
"$NODE" scripts/test-pdf.mjs && echo "OK — PDF lisibles." || echo "Échec — voir docs/PDF_SETUP.md"
