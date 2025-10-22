#!/bin/bash

# ============================================================================
#   CoreDocument - Script di Importazione Interattivo per Linux
# ============================================================================

set -e  # Interrompe lo script in caso di errore

# --- Configurazione ---
SOURCE_PATH="/mnt/DOCUMENTI"
API_URL="http://localhost:81/api"
BATCH_SIZE=20

echo ""
echo "========================================"
echo "  CoreDocument - Import Documenti"
echo "========================================"
echo ""

# --- Controllo prerequisiti ---
if ! command -v curl &> /dev/null; then
    echo "[ERRORE] 'curl' non è installato. Installalo per continuare."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "[ERRORE] 'jq' non è installato. Installalo per continuare."
    echo "Esempio per Ubuntu/Debian: sudo apt-get update && sudo apt-get install jq"
    exit 1
fi

# --- Richiesta credenziali ---
echo "Per favore, inserisci le credenziali per ottenere il token di accesso."
read -p "Email: " EMAIL
read -s -p "Password: " PASSWORD
echo ""  # Nuova riga dopo la password

LOGIN_URL="$API_URL/auth/login"

echo ""
echo "Tentativo di ottenere il token JWT da $LOGIN_URL..."
echo ""

# --- Ottieni il token JWT ---
JSON_PAYLOAD=$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASSWORD")

TOKEN_RESPONSE=$(curl -s -X POST "$LOGIN_URL" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")

export JWT_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

# --- Controllo token ---
if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" == "null" ]; then
    echo "[ERRORE] Impossibile ottenere il JWT token. Verifica le credenziali e che l'API sia in esecuzione."
    echo "Risposta del server: $TOKEN_RESPONSE"
    exit 1
fi

echo "[OK] Token JWT ottenuto con successo."
echo ""

# --- Conferma esecuzione ---
echo "Configurazione:"
echo "  Source:     $SOURCE_PATH"
echo "  API URL:    $API_URL"
echo "  Batch size: $BATCH_SIZE"
echo ""
echo "ATTENZIONE: Verifica che CoreDocument sia attivo!"
echo ""
read -p "Vuoi procedere con l'import? (S/N): " CONFIRM

if [[ "$CONFIRM" != "S" && "$CONFIRM" != "s" ]]; then
    echo "Import annullato."
    exit 0
fi

# --- Esecuzione import ---
echo ""
echo "Avvio import..."
echo ""

node import-legacy-documents.js \
    --source "$SOURCE_PATH" \
    --api-url "$API_URL" \
    --token "$JWT_TOKEN" \
    --batch-size $BATCH_SIZE \
    --verbose

RESULT=$?

# --- Risultato finale ---
echo ""
echo "========================================"

if [ $RESULT -eq 0 ]; then
    echo "[OK] Import completato con successo!"
else
    echo "[ERRORE] Import fallito. Controlla import-log.json"
fi

echo ""
read -p "Premi Invio per continuare..."
