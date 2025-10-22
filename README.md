# CoreDocument

Sistema di gestione documentale per DDT arrivo merce - Modernizzato con NestJS, Next.js 14 e ricerca full-text Meilisearch.

## Architettura

**Monorepo** con workspace npm per gestire backend e frontend come progetti collegati.

```
CoreDocument/
├── apps/
│   ├── backend/          # NestJS API + Prisma ORM
│   └── frontend/         # Next.js 14 App Router + Material-UI
├── scripts/              # Utility per import legacy e gestione
├── docker-compose.yml    # Orchestrazione container
├── .env                  # Configurazione centralizzata
└── package.json          # Root workspace
```

## Prerequisiti

**CoreServices** deve essere attivo prima di avviare CoreDocument:

```bash
cd ../CoreServices
start.bat
```

CoreServices fornisce:
- MySQL (database)
- MinIO (object storage)
- Meilisearch (search engine)
- Nginx centralizzato (reverse proxy)

## Avvio Rapido

```bash
# Avvia applicazione (backend + frontend)
start.bat

# Ferma applicazione
stop.bat

# Visualizza log in tempo reale
logs.bat

# Rebuild completo (dopo modifiche codice)
build.bat

# Rebuild solo un servizio
build.bat backend
build.bat frontend
```

## Accesso

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| **Applicazione** | http://localhost:81 | Frontend + API tramite nginx |
| **API diretta** | http://localhost:81/api | Backend API |
| **Frontend debug** | http://localhost:3002 | Next.js dev server (solo sviluppo) |
| **Backend debug** | http://localhost:3003/api | NestJS diretto (solo sviluppo) |

## Funzionalità Principali

### 📄 Gestione Documenti
- **Upload singolo/multiplo** di PDF e immagini
- **Metadati automatici**: fornitore, numero documento, data, mese, anno
- **Storage su MinIO**: `documents/{year}/{month}/{day}/{filename}`
- **Rinomina automatica**: file seguono formato `fornitore numero.ext`
- **Preview inline**: visualizzazione PDF direttamente in app
- **Download individuale** o **bulk download ZIP** con filtri

### 🔍 Ricerca Avanzata
- **Full-text search** con Meilisearch (limite 10.000 documenti)
- **Global search**: ricerca rapida da qualsiasi pagina
- **Filtri multipli**: fornitore, anno, mese, numero documento, range date
- **Apertura automatica**: click su risultato → preview immediata
- **Ricerca intelligente**: trova anche match parziali (es. "AMBROSIANA" trova "CHIMICA INDUSTRIALE AMBROSIANA")

### 🔐 Autenticazione e Autorizzazione
- **Accesso pubblico**: visualizzazione e ricerca documenti
- **Area admin** (login richiesto):
  - Upload documenti
  - Modifica metadati
  - Eliminazione documenti
  - Gestione utenti e tools
- **JWT tokens** con validità 7 giorni

### 📦 Bulk Download
- **Download ZIP** di documenti multipli
- **Filtri opzionali**: fornitore, range date (da/a)
- **Struttura organizzata**: `fornitore/anno/mese/file.pdf`
- **Nome automatico**: `documenti_2025-01-15.zip`

### 👥 Gestione per Fornitore
- **Pagina dedicata** per ogni fornitore
- **Statistiche**: totale documenti, ultimo documento
- **Vista tabella** e **vista griglia**
- **Filtri locali** per numero documento

### 🎨 UI/UX
- **Material-UI v6** con design moderno
- **Responsive**: funziona su desktop, tablet, mobile
- **Dark mode ready** (tema configurabile)
- **Skeleton loading** e stati di caricamento
- **Notifiche snackbar** per feedback utente

## Prima Esecuzione

### 1. Crea Database

```bash
docker exec core-mysql mysql -uroot -prootpassword -e "
CREATE DATABASE IF NOT EXISTS coredocument;
CREATE USER IF NOT EXISTS 'coredocument'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coredocument.* TO 'coredocument'@'%';
FLUSH PRIVILEGES;
"
```

### 2. Configura Environment

Il file `.env` contiene tutte le configurazioni. Già configurato per funzionare con CoreServices:

```env
# Database
DATABASE_URL=mysql://root:rootpassword@core-mysql:3306/coredocument

# MinIO
MINIO_ENDPOINT=core-minio
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Meilisearch
MEILISEARCH_HOST=http://core-meilisearch:7700
MEILISEARCH_API_KEY=masterKeyChangeThis

# API
APP_PORT=3003
NEXT_PUBLIC_API_URL=http://localhost:81/api
```

### 3. Avvia Container

```bash
# Assicurati che CoreServices sia avviato
cd ../CoreServices && start.bat && cd ../CoreDocument

# Avvia CoreDocument
start.bat
```

Al primo avvio, Prisma eseguirà automaticamente le migrations e il seed del database.

### 4. Accedi

Vai su http://localhost:81

**Credenziali admin** (create dal seed):
- Email: `admin@coredocument.com`
- Password: `admin123`

## Sviluppo

### Sviluppo Locale (senza Docker)

```bash
# 1. Installa dipendenze
npm install

# 2. Avvia backend
npm run dev:backend

# 3. In un altro terminale, avvia frontend
npm run dev:frontend

# Backend: http://localhost:3003
# Frontend: http://localhost:3000
```

### Modifiche al Database (Prisma)

```bash
# 1. Modifica schema
code apps/backend/prisma/schema.prisma

# 2. Crea migration
docker exec coredocument-backend npx prisma migrate dev --name nome_migration

# 3. Rigenera client Prisma
docker exec coredocument-backend npx prisma generate

# 4. Rebuild backend
build.bat backend
```

### Prisma Studio (GUI Database)

```bash
docker exec -it coredocument-backend npx prisma studio
# Apri http://localhost:5555
```

### Seed Database

```bash
# Reset database + seed
docker exec coredocument-backend npx prisma migrate reset

# Solo seed
docker exec coredocument-backend npm run seed
```

## Import Documenti Legacy

Script Node.js per importare documenti da cartella di rete Windows (Y:\DDT\) al nuovo sistema.

### Installazione

```bash
cd scripts
npm install
```

### Comandi

```bash
# Test connessione API
node import-legacy-documents.js --dry-run --source Y:\

# Import singolo mese (test)
node import-legacy-documents.js \
  --source Y:\ \
  --test \
  --year 2025 \
  --month Gennaio \
  --token "YOUR_JWT_TOKEN"

# Import completo
node import-legacy-documents.js \
  --source Y:\ \
  --token "YOUR_JWT_TOKEN" \
  --verbose
```

**Ottenere JWT Token**:
1. Login su http://localhost:81
2. Apri DevTools → Console
3. Esegui: `localStorage.getItem('auth-token')`

**Struttura attesa**:
```
Y:\DDT\
├── 2023\
│   ├── GENNAIO\
│   │   └── fornitore\
│   │       ├── doc1.pdf
│   │       └── doc2.pdf
│   └── FEBBRAIO\
└── 2024\
```

Il file verrà rinominato automaticamente in formato: `fornitore numero.pdf`

## Comandi Docker Utili

```bash
# Restart singolo servizio
docker restart coredocument-backend
docker restart coredocument-frontend

# Shell nei container
docker exec -it coredocument-backend sh
docker exec -it coredocument-frontend sh

# Logs specifici
docker logs coredocument-backend -f
docker logs coredocument-frontend -f

# Stato container
docker ps --filter "name=coredocument"

# Rimozione completa (attenzione: elimina anche volumi)
docker-compose -p coredocument down -v
```

## Database

### Schema Principale

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Document {
  id            String   @id @default(uuid())
  filename      String
  minioKey      String   @unique
  supplier      String?
  docNumber     String?
  date          DateTime
  month         String
  year          Int
  fileSize      BigInt
  fileExtension String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([supplier])
  @@index([year, month])
  @@index([date])
}
```

### Indici Meilisearch

```javascript
searchableAttributes: ['supplier', 'docNumber', 'fileName']
filterableAttributes: ['year', 'month', 'date', 'supplier', 'docNumber']
sortableAttributes: ['date', 'createdAt']
```

## Porte Utilizzate

| Porta | Servizio | Descrizione |
|-------|----------|-------------|
| 81 | Nginx | Accesso pubblico (frontend + API) |
| 3002 | Frontend | Next.js dev server (host) |
| 3003 | Backend | NestJS API (host) |

**Porte CoreServices**:
- 80: CoreMachine
- 3306: MySQL
- 8080: PHPMyAdmin
- 9000/9001: MinIO
- 7700: Meilisearch

## Troubleshooting

### Container non si avvia

```bash
# Controlla logs
logs.bat

# Verifica network
docker network inspect core-network

# Verifica CoreServices
cd ../CoreServices && docker ps
```

### Database non raggiungibile

```bash
# Verifica MySQL
docker exec core-mysql mysql -uroot -prootpassword -e "SHOW DATABASES;"

# Ricrea database
docker exec core-mysql mysql -uroot -prootpassword -e "
DROP DATABASE IF EXISTS coredocument;
CREATE DATABASE coredocument;
"

# Re-run migrations
docker exec coredocument-backend npx prisma migrate deploy
```

### MinIO non raggiungibile

```bash
# Verifica MinIO
curl http://localhost:9000/minio/health/live

# Console MinIO
# http://localhost:9001
# User: minioadmin
# Pass: minioadmin123
```

### Meilisearch non indicizza

```bash
# Verifica indice
curl http://localhost:7700/indexes

# Re-sync documenti
docker exec coredocument-backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.document.findMany().then(docs => console.log('Docs:', docs.length));
"
```

### Frontend 404 su assets

Problema: nginx non configurato correttamente.

Soluzione: CoreServices gestisce nginx centralizzato su porta 81.

```bash
# Verifica nginx
docker ps --filter "name=nginx"

# Se presente nginx locale, fermalo
docker stop coredocument-nginx
```

## Stack Tecnologico

### Backend
- **NestJS** v10 - Framework Node.js enterprise
- **Prisma** v5 - ORM con type-safety
- **MySQL** - Database relazionale
- **JWT** - Autenticazione stateless
- **MinIO** - Object storage S3-compatible
- **Meilisearch** - Full-text search engine
- **Archiver** - Creazione ZIP per bulk download

### Frontend
- **Next.js** v14 - React framework con App Router
- **React** v18 - UI library
- **Material-UI** v6 - Component library
- **Axios** - HTTP client
- **Notistack** - Toast notifications
- **date-fns** - Date manipulation
- **Zustand** - State management

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (centralizzato in CoreServices)

## Differenze da Versione Legacy (Python)

### Miglioramenti ✅
- Storage su **MinIO** invece di cartella rete Windows
- Ricerca con **Meilisearch** più veloce e scalabile
- **UI moderna** responsive con Material-UI
- **API RESTful** ben strutturata
- **TypeScript** end-to-end per type safety
- **Monorepo** con workspace condivisi
- **Preview inline** PDF senza download
- **Bulk download ZIP** con filtri avanzati
- **Global search** con apertura automatica preview
- **Autenticazione JWT** sicura
- **Docker** per deploy consistente

### Funzionalità Mantenute ✅
- Upload documenti DDT
- Ricerca per fornitore, numero, data
- Gestione metadati
- Download documenti
- Organizzazione per anno/mese

### Nuove Feature 🆕
- **Edit documenti**: modifica metadati post-upload
- **Bulk download**: download multipli in ZIP
- **Global search**: ricerca rapida da header
- **Auto-preview**: click su risultato → preview immediata
- **Rename automatico**: file seguono formato standard
- **Accesso pubblico**: no login per visualizzazione
- **Admin panel**: gestione utenti e permessi

## Roadmap

- [ ] Dashboard con statistiche e grafici
- [ ] Export CSV/Excel per reportistica
- [ ] Notifiche email per documenti nuovi
- [ ] OCR per estrazione automatica metadati
- [ ] Versioning documenti
- [ ] Commenti e annotazioni
- [ ] Workflow approvazione documenti
- [ ] Integrazione con CoreMachine

## Supporto

Per problemi o domande, consulta:
- Logs: `logs.bat`
- CoreServices: `../CoreServices/README.md`
- Docker compose: `docker-compose.yml`

## Licenza

Uso interno aziendale.
