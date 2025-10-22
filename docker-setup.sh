#!/bin/bash

# CoreDocument - Docker Setup Script
# Questo script verifica i prerequisiti e avvia CoreDocument in Docker

set -e

echo "🚀 CoreDocument Docker Setup"
echo "=============================="
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verifica Docker
echo "📦 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non trovato. Installalo prima di continuare.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker trovato${NC}"
echo ""

# 2. Verifica Docker Compose
echo "📦 Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose non trovato. Installalo prima di continuare.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose trovato${NC}"
echo ""

# 3. Verifica rete core-network
echo "🌐 Verificando rete core-network..."
if ! docker network inspect core-network &> /dev/null; then
    echo -e "${YELLOW}⚠️  Rete core-network non trovata.${NC}"
    echo "   CoreMachine deve essere avviato prima di CoreDocument."
    echo ""
    echo "   Vuoi che la crei automaticamente? (s/n)"
    read -r response
    if [[ "$response" =~ ^([sS]|[yY]|[sS][iI])$ ]]; then
        echo "   Creando rete core-network..."
        docker network create core-network
        echo -e "${GREEN}✅ Rete core-network creata${NC}"
    else
        echo -e "${RED}❌ Setup interrotto. Avvia prima CoreMachine.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Rete core-network trovata${NC}"
fi
echo ""

# 4. Verifica container CoreMachine
echo "🔍 Verificando servizi CoreMachine..."
SERVICES_OK=true

if ! docker ps | grep -q "core-mysql"; then
    echo -e "${YELLOW}⚠️  Container core-mysql non attivo${NC}"
    SERVICES_OK=false
fi

if ! docker ps | grep -q "core-minio"; then
    echo -e "${YELLOW}⚠️  Container core-minio non attivo${NC}"
    SERVICES_OK=false
fi

if ! docker ps | grep -q "core-meilisearch"; then
    echo -e "${YELLOW}⚠️  Container core-meilisearch non attivo${NC}"
    SERVICES_OK=false
fi

if [ "$SERVICES_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Alcuni servizi CoreMachine non sono attivi.${NC}"
    echo "   CoreDocument può comunque partire ma potrebbe non funzionare correttamente."
    echo "   Ti consiglio di avviare prima CoreMachine."
    echo ""
    echo "   Vuoi continuare comunque? (s/n)"
    read -r response
    if [[ ! "$response" =~ ^([sS]|[yY]|[sS][iI])$ ]]; then
        echo -e "${RED}❌ Setup interrotto.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Tutti i servizi CoreMachine sono attivi${NC}"
fi
echo ""

# 5. Verifica file .env
echo "⚙️  Verificando configurazione..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  File .env non trovato${NC}"
    echo "   Copio .env.example a .env..."
    cp .env.example .env
    echo -e "${GREEN}✅ File .env creato${NC}"
    echo "   Modifica .env con le tue configurazioni prima di procedere."
    echo ""
    echo "   Vuoi continuare con le configurazioni di default? (s/n)"
    read -r response
    if [[ ! "$response" =~ ^([sS]|[yY]|[sS][iI])$ ]]; then
        echo -e "${YELLOW}⚠️  Setup in pausa. Modifica .env e riavvia lo script.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ File .env trovato${NC}"
fi
echo ""

# 6. Build delle immagini
echo "🏗️  Building Docker images..."
echo "   Questo potrebbe richiedere alcuni minuti..."
echo ""
docker-compose build
echo -e "${GREEN}✅ Build completato${NC}"
echo ""

# 7. Avvio dei container
echo "🚀 Avviando i container..."
docker-compose up -d
echo -e "${GREEN}✅ Container avviati${NC}"
echo ""

# 8. Attendi che i servizi siano pronti
echo "⏳ Attendendo che i servizi siano pronti..."
sleep 5

# 9. Verifica stato
echo "📊 Stato dei container:"
docker-compose ps
echo ""

# 10. Riepilogo
echo "=============================="
echo -e "${GREEN}✅ CoreDocument è pronto!${NC}"
echo ""
echo "🌐 Accessi:"
echo "   - Applicazione: http://localhost:81"
echo "   - API: http://localhost:81/api"
echo "   - Backend diretto: http://localhost:3003"
echo "   - Frontend diretto: http://localhost:3002"
echo ""
echo "📝 Comandi utili:"
echo "   - Log: docker-compose logs -f"
echo "   - Stop: docker-compose down"
echo "   - Restart: docker-compose restart"
echo ""
echo "📚 Per maggiori informazioni: cat DOCKER.md"
echo ""
