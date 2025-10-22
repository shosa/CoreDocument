#!/bin/bash
# Test Dry Run - Simula import senza uploadare file reali

echo ""
echo "========================================"
echo "  CoreDocument - Dry Run Test"
echo "========================================"
echo ""
echo "Questo script SIMULA l'import senza uploadare file reali."
echo "Utile per verificare che lo script funzioni correttamente."
echo ""

# Path alla cartella sorgente documenti
export SOURCE_PATH="/mnt/DOCUMENTI"

echo "Source: $SOURCE_PATH"
echo ""
read -p "Confermi di voler procedere con il dry-run? (S/N): " CONFIRM

if [[ "$CONFIRM" != "S" && "$CONFIRM" != "s" ]]; then
    echo "Test annullato."
    exit 0
fi

echo ""
echo "Avvio dry-run test..."
echo ""

node import-legacy-documents.js --dry-run --source "$SOURCE_PATH" --verbose

echo ""
echo "========================================"
echo "   Test Completato"
echo "========================================"
echo ""
echo "Controlla l'output sopra per verificare che:"
echo "- I file vengano trovati correttamente"
echo "- Il parsing dei filename funzioni"
echo "- Le date vengano estratte correttamente"
echo ""
read -p "Premi Invio per continuare..."
