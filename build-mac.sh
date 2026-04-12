#!/bin/bash
echo "============================================"
echo "  Node Organisation - Build Mac .app"
echo "============================================"
echo ""

echo "[1/3] Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "ERREUR: npm install a échoué."
    exit 1
fi

echo ""
echo "[2/3] Compilation du projet..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERREUR: La compilation a échoué."
    exit 1
fi

echo ""
echo "[3/3] Création de l'application Mac..."
npx @electron/packager . "Node Organisation" \
    --platform=darwin \
    --arch=x64,arm64 \
    --out=release \
    --overwrite \
    --ignore="^/src" \
    --ignore="^/public" \
    --ignore="^/electron" \
    --ignore="^/\.git" \
    --ignore="\.ts$" \
    --ignore="\.bat$" \
    --ignore="\.sh$" \
    --ignore="^/vite" \
    --ignore="^/tsconfig" \
    --ignore="^/release" \
    --app-version=1.0.0

if [ $? -ne 0 ]; then
    echo "ERREUR: Le packaging a échoué."
    exit 1
fi

echo ""
echo "============================================"
echo "  BUILD TERMINÉ !"
echo "  L'application se trouve dans :"
echo "  release/Node Organisation-darwin-x64/  (Intel)"
echo "  release/Node Organisation-darwin-arm64/ (Apple Silicon)"
echo ""
echo "  Glisse 'Node Organisation.app' dans"
echo "  ton dossier Applications !"
echo "============================================"
open release/
