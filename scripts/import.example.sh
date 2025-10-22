#!/bin/bash
# Script di esempio per import documenti legacy
# Copia questo file come import.sh e configura le variabili

# ============================================================================ 
# CONFIGURAZIONE
# ============================================================================ 

# Path alla cartella sorgente documenti
export SOURCE_PATH="/mnt/DOCUMENTI"

# API URL (default: http://localhost:81/api)
export API_URL="http://localhost:81/api"

# Batch size (numero di file per upload, default: 20)
export BATCH_SIZE=20

# Credenziali per il login automatico
EMAIL="admin@coredocument.com"
PASSWORD="admin123"

# ============================================================================ 
# NON MODIFICARE SOTTO QUESTA LINEA
# ============================================================================ 

echo "========================================"



if [ $? -eq 0 ]; then

    echo "[OK] Import completato con successo!"

else

    echo "[ERRORE] Import fallito. Controlla import-log.json"

fi



echo ""

read -p "Premi Invio per continuare..."

"
echo "  CoreDocument - Import Documenti"
echo "========================================"
echo ""

# --- Recupero automatico del Token ---
LOGIN_URL="$API_URL/auth/login"

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

if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" == "null" ]; then
    echo "[ERRORE] Impossibile ottenere il JWT token. Verifica le credenziali e che l\'API sia in esecuzione."
    echo "Risposta del server:"
    echo "$TOKEN_RESPONSE"
    exit 1
fi

echo "[OK] Token JWT ottenuto con successo."
echo ""
# --- Fine recupero automatico del Token ---


# Chiedi conferma
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

echo ""
echo "Avvio import..."
echo ""

node import-legacy-documents.js \
    --source "$SOURCE_PATH" \
    --api-url "$API_URL" \
    --token "$JWT_TOKEN" \
    --batch-size $BATCH_SIZE \
    --verbose

echo ""
echo "========================================"

if [ $? -eq 0 ]; then
    echo "[OK] Import completato con successo!"
else
    echo "[ERRORE] Import fallito. Controlla import-log.json"
fi

echo ""
read -p "Premi Invio per continuare...""

if [ $? -eq 0 ]; then
    echo "[OK] Import completato con successo!"
else
    echo "[ERRORE] Import fallito. Controlla import-log.json"
fi

echo ""
read -p "Premi Invio per continuare..."