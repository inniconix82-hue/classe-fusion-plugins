#!/bin/bash
# Se place dans le dossier du script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Raccourcis Clavier - Build Mac .app"
echo "============================================"
echo ""

echo "[1/2] Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "ERREUR: npm install a échoué."
    exit 1
fi

echo ""
echo "[2/2] Build et packaging..."
node "$SCRIPT_DIR/build-mac.js"
if [ $? -ne 0 ]; then
    echo "ERREUR: Le build a échoué."
    exit 1
fi

echo ""
echo "============================================"
echo "  BUILD TERMINÉ !"
echo "  L'application se trouve dans : release/"
echo "============================================"
open "$SCRIPT_DIR/release/"
