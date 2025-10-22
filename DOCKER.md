# CoreDocument - Docker Setup

## Prerequisiti

1. **Docker e Docker Compose** installati
2. **CoreMachine** deve essere attivo con la sua rete condivisa `core-network`

## Struttura

CoreDocument condivide i servizi infrastrutturali con CoreMachine:
- **MySQL** (core-mysql)
- **MinIO** (core-minio)
- **Meilisearch** (core-meilisearch)

## Setup Rapido

### 1. Verifica che CoreMachine sia attivo

```bash
docker ps | grep core-
```

Dovresti vedere:
- `core-mysql`
- `core-minio`
- `core-meilisearch`

Se non sono attivi, vai in CoreMachine e avvia:
```bash
cd ../CoreMachine
docker-compose up -d
```

### 2. Configura le variabili d'ambiente

```bash
# Copia il template .env
cp .env.example .env

# Modifica i valori se necessario
nano .env
```

**Importante**: Usa le stesse credenziali di CoreMachine per MySQL, MinIO e Meilisearch.

### 3. Build e avvio

```bash
# Build delle immagini
docker-compose build

# Avvio dei container
docker-compose up -d

# Verifica lo stato
docker-compose ps
```

### 4. Verifica i log

```bash
# Tutti i log
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

## Accesso

- **Applicazione**: http://localhost:81
- **API**: http://localhost:81/api
- **Backend diretto**: http://localhost:3003
- **Frontend diretto**: http://localhost:3002

## Database

Il database viene inizializzato automaticamente con Prisma:

```bash
# Prisma migrate viene eseguito automaticamente all'avvio del backend
# Se serve rieseguirlo manualmente:
docker-compose exec backend npx prisma migrate deploy
```

## Comandi Utili

```bash
# Stop
docker-compose down

# Stop e rimuovi volumi
docker-compose down -v

# Rebuild completo
docker-compose build --no-cache

# Restart di un servizio specifico
docker-compose restart backend

# Accedi al container backend
docker-compose exec backend sh

# Accedi al container frontend
docker-compose exec frontend sh
```

## Troubleshooting

### Errore "network core-network not found"

CoreMachine deve essere avviato prima:
```bash
cd ../CoreMachine
docker-compose up -d
```

### Errore di connessione a MySQL

Verifica che core-mysql sia in esecuzione:
```bash
docker ps | grep core-mysql
```

### Rebuild completo

Se ci sono problemi con le dipendenze:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Verifica connettività tra container

```bash
# Dal backend, prova a pingare MySQL
docker-compose exec backend ping core-mysql

# Verifica le reti
docker network ls
docker network inspect core-network
```

## Porte Utilizzate

| Servizio | Porta Host | Porta Container | Descrizione |
|----------|------------|-----------------|-------------|
| Nginx | 81 | 80 | Reverse proxy principale |
| Frontend | 3002 | 3000 | Next.js (solo sviluppo) |
| Backend | 3003 | 3003 | NestJS API (solo sviluppo) |

## Note di Produzione

Per un ambiente di produzione:

1. **Cambia le credenziali** in `.env`
2. **Configura HTTPS** in `nginx/nginx.conf`
3. **Usa variabili d'ambiente sicure** per JWT_SECRET
4. **Considera un reverse proxy esterno** (Traefik, Nginx Proxy Manager)
5. **Configura backup automatici** del database

## Architettura

```
┌─────────────────────────────────────────────┐
│         CoreMachine (porta 80)              │
│  ┌──────────┬──────────┬──────────────┐    │
│  │  MySQL   │  MinIO   │ Meilisearch  │    │
│  └────┬─────┴────┬─────┴───────┬──────┘    │
│       │          │             │            │
└───────┼──────────┼─────────────┼────────────┘
        │          │             │
   core-network (Docker network)
        │          │             │
┌───────┼──────────┼─────────────┼────────────┐
│       │          │             │            │
│  ┌────▼──────────▼─────────────▼──────┐    │
│  │       CoreDocument Backend          │    │
│  │         (NestJS - 3003)              │    │
│  └────────────────┬────────────────────┘    │
│                   │                          │
│  ┌────────────────▼────────────────────┐    │
│  │      CoreDocument Frontend          │    │
│  │       (Next.js - 3000)               │    │
│  └────────────────┬────────────────────┘    │
│                   │                          │
│  ┌────────────────▼────────────────────┐    │
│  │          Nginx (porta 81)            │    │
│  └─────────────────────────────────────┘    │
│                                              │
│         CoreDocument (porta 81)             │
└──────────────────────────────────────────────┘
```
