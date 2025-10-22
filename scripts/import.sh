#!/bin/bash

# ============================================================================
#   CoreDocument - Script di Importazione Interattivo per Linux
# ============================================================================

# --- Configurazione ---
SOURCE_PATH="/mnt/DOCUMENTI"
API_URL="http://localhost:81/api"
BATCH_SIZE=20

echo ""
echo "========================================"
echo "  CoreDocument - Import Documenti"
echo "========================================"
echo ""

# --- Richiesta Credenziali e Recupero Token ---
echo "Per favore, inserisci le credenziali per ottenere il token di accesso."
read -p "Email: " EMAIL
read -s -p "Password: " PASSWORD
echo "" # Aggiunge una nuova riga dopo l'input della password

LOGIN_URL="$API_URL/auth/login"

echo ""
echo "Tentativo di ottenere il token JWT da $LOGIN_URL..."

# Verifica se jq è installato
if ! command -v jq &> /dev/null
then
    echo "[ERRORE] 'jq' non è installato. Per favore, installalo per continuare."
    echo "Esempio per Ubuntu/Debian: sudo apt-get update && sudo apt-get install jq"
    exit 1
fi

# Ottieni il token
TOKEN_RESPONSE=$(curl -s -X POST "$LOGIN_URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Estrai il token dal JSON di risposta
export JWT_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

# Controlla se il token è stato ottenuto
if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" == "null" ]; then
    echo "[ERRORE] Impossibile ottenere il JWT token. Verifica le credenziali e che l'API sia in esecuzione."
    echo "Risposta del server: $TOKEN_RESPONSE"
    exit 1
fi

echo "[OK] Token JWT ottenuto con successo."
echo ""

# --- Conferma Esecuzione ---
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

# --- Esecuzione Script Node ---
echo ""
echo "Avvio import..."
echo ""

node import-legacy-documents.js \
    --source "$SOURCE_PATH" \
    --api-url "$API_URL" \
    --token "$JWT_TOKEN" \
    --batch-size $BATCH_SIZE \
    --verbose

# --- Risultato ---
echo ""
echo "========================================"

if [ $? -eq 0 ]; then
    echo "[OK] Import completato con successo!"
else
    echo "[ERRORE] Import fallito. Controlla import-log.json"
fi

echo ""
read -p "Premi Invio per continuare..."
