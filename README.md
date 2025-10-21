# CoreDocument

Sistema di gestione documentale per DDT arrivo merce - Versione modernizzata con NestJS e Next.js.

## Prerequisiti

Prima di avviare CoreDocument, assicurati che **CoreServices** sia attivo:
```bash
cd ../CoreServices
start.bat
```

## Comandi Rapidi

```bash
# Avvia l'applicazione
start.bat

# Ferma l'applicazione
stop.bat

# Visualizza i log
logs.bat

# Rebuild (dopo modifiche al codice)
build.bat
build.bat --no-cache  # Rebuild completo
```

## Comandi Manuali

```bash
# Start
docker-compose -p coredocument up -d

# Stop
docker-compose -p coredocument down

# Build
docker-compose -p coredocument build

# Logs
docker-compose -p coredocument logs -f [backend|frontend|nginx]
```

## Accesso

- **Frontend**: http://localhost:81
- **Backend API**: http://localhost:81/api
- **Frontend diretto**: http://localhost:3002 (solo per debug)
- **Backend diretto**: http://localhost:3003/api (solo per debug)

## Struttura

```
CoreDocument/
├── apps/
│   ├── backend/     # NestJS API
│   └── frontend/    # Next.js UI
├── nginx/           # Reverse proxy config
├── docker-compose.yml
├── .env
└── package.json
```

## Database

CoreDocument usa il database `coredocument` su MySQL condiviso (CoreServices).

### Creare il database (prima esecuzione)

```bash
docker exec core-mysql mysql -uroot -prootpassword -e "
CREATE DATABASE IF NOT EXISTS coredocument;
CREATE USER IF NOT EXISTS 'coredocument'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coredocument.* TO 'coredocument'@'%';
FLUSH PRIVILEGES;
"
```

## Funzionalità

### Gestione Documenti
- **Upload documenti** (PDF, immagini) su MinIO
- **Metadati**: fornitore, numero documento, data
- **Organizzazione automatica**: anno/mese/giorno
- **Download** documenti
- **Modifica/Eliminazione** documenti

### Ricerca Avanzata
- **Full-text search** con Meilisearch
- **Filtri multipli**: fornitore, numero doc, data, mese, anno
- **Ricerca veloce** e real-time

### Preferiti
- **Aggiungi/rimuovi** documenti preferiti
- **Lista personale** per ogni utente

### Storage
- **MinIO** per file storage (non più cartella di rete)
- **Path structure**: `documents/{year}/{month}/{day}/{filename}`
- **Backup e replica** facili

## Sviluppo

### Modifiche al Backend

```bash
# 1. Modifica il codice in apps/backend
# 2. Rebuild
build.bat backend
# 3. Restart
stop.bat && start.bat
```

### Modifiche al Frontend

```bash
# 1. Modifica il codice in apps/frontend
# 2. Rebuild
build.bat frontend
# 3. Restart
stop.bat && start.bat
```

### Modifiche al Database (Prisma)

```bash
# 1. Modifica apps/backend/prisma/schema.prisma
# 2. Crea migration
docker exec coredocument-backend npx prisma migrate dev --name nome_migration
# 3. Rebuild backend
build.bat backend
```

## Differenze dalla versione Python

### Miglioramenti
- ✅ **Storage su MinIO** invece di cartella di rete Windows
- ✅ **Ricerca con Meilisearch** più veloce e potente
- ✅ **UI moderna** con Material-UI
- ✅ **API RESTful** ben strutturata
- ✅ **Autenticazione JWT** sicura
- ✅ **Docker** per deploy facile
- ✅ **TypeScript** per type safety

### Funzionalità mantenute
- ✅ Upload documenti DDT
- ✅ Ricerca per fornitore, numero, data
- ✅ Preferiti personali
- ✅ Gestione metadati
- ✅ Download documenti

### Da implementare (opzionale)
- ✅ **Scanner filesystem per importare documenti esistenti** → Vedi [scripts/README.md](scripts/README.md)
- ⏳ Admin panel per gestione database
- ⏳ Statistiche e dashboard

## Network

CoreDocument si connette alla network `core-network` (creata da CoreServices) per accedere a MySQL, MinIO e Meilisearch.

## Import Documenti Legacy

Per importare documenti dalla vecchia struttura (cartella di rete Y:\) al nuovo sistema:

```bash
cd scripts
npm install

# Test funzioni
npm test

# Dry run (simulazione)
node import-legacy-documents.js --dry-run --source Y:\

# Test su un mese
node import-legacy-documents.js --test --year 2023 --month GENNAIO --source Y:\ --token YOUR_JWT_TOKEN

# Import completo
node import-legacy-documents.js --source Y:\ --token YOUR_JWT_TOKEN --verbose
```

**Documentazione completa:** [scripts/README.md](scripts/README.md)

## Porte utilizzate

- **80**: CoreMachine (nginx)
- **81**: CoreDocument (nginx) ← Questa applicazione
- **3001**: CoreMachine backend
- **3002**: CoreDocument frontend ← Questa applicazione (host)
- **3003**: CoreDocument backend ← Questa applicazione (host)
- **8080**: PHPMyAdmin
- **9000/9001**: MinIO
- **7700**: Meilisearch
