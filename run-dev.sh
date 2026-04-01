#!/bin/bash
# Script pour lancer BaoPixel Studio OS en local (for WSL/Unix)

cd "$(dirname "$0")"

echo "=== BaoPixel Studio OS v4 - Serveur Local ==="
echo ""
echo "Installation des dépendances..."
npm install

echo ""
echo "Lancement du serveur de développement..."
echo "L'app démarre sur: http://localhost:3000"
echo ""

npm run dev

