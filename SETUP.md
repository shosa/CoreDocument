# CoreDocument - Setup Completo

## ✅ Cosa è stato creato

CoreDocument è un sistema completo di gestione documentale per DDT arrivo merce, sviluppato con le stesse tecnologie e UI di CoreMachine.

### Struttura Progetto

```
CoreDocument/
├── apps/
│   ├── backend/              # NestJS Backend (Porta 3002)
│   │   ├── src/
│   │   │   ├── auth/         # Autenticazione JWT
│   │   │   ├── documents/    # Gestione documenti
│   │   │   ├── favorites/    # Preferiti utente
│   │   │   ├── search/       # Ricerca Meilisearch
│   │   │   ├── minio/        # Storage MinIO
│   │   │   ├── meilisearch/  # Indicizzazione
│   │   │   └── prisma/       # Database
│   │   ├── prisma/
│   │   │   └── schema.prisma # Schema database
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/             # Next.js Frontend (Porta 3000→3003)
│       ├── src/
│       │   ├── app/          # Pages (Next.js 14)
│       │   ├── components/   # Componenti UI
│       │   ├── lib/          # API client
│       │   ├── types/        # TypeScript types
│       │   └── store/        # Zustand store
│       ├── Dockerfile
│       └── package.json
│
├── nginx/                    # Reverse Proxy
│   └── nginx.conf
├── docker-compose.yml
├── .env
├── start.bat
├── stop.bat
├── build.bat
├── logs.bat
└── README.md
```

## 🎯 Funzionalità Implementate

### Backend (NestJS + Prisma + MinIO + Meilisearch)

1. **Autenticazione**
   - Login JWT
   - Guards per route protette
   - User management

2. **Gestione Documenti**
   - Upload multiplo (PDF, immagini)
   - Storage su MinIO: `documents/{year}/{month}/{day}/{filename}`
   - Metadati: fornitore, numero documento, data
   - Download (streaming + presigned URL)
   - Modifica ed eliminazione

3. **Ricerca Avanzata**
   - Full-text search con Meilisearch
   - Filtri: fornitore, numero, data, mese, anno
   - Paginazione

4. **Preferiti**
   - Aggiungi/rimuovi preferiti
   - Lista personale per utente
   - Toggle rapido

### Frontend (Next.js 14 + Material-UI)

1. **UI Moderna**
   - Stesso design system di CoreMachine
   - Responsive
   - Dark/Light mode ready

2. **Pagine**
   - Login
   - Lista documenti con filtri
   - Upload documenti
   - Dettaglio documento
   - Preferiti
   - Ricerca

3. **Features**
   - React Query per data fetching
   - Zustand per state management
   - Form validation con Yup
   - Notifiche con Notistack

## 🚀 Come Avviare

### 1. Prerequisito: CoreServices attivo

```bash
cd ../CoreServices
start.bat
```

### 2. Crea il database (già fatto)

Il database `coredocument` è già stato creato automaticamente.

### 3. Avvia CoreDocument

```bash
cd CoreDocument
build.bat       # Prima volta: build delle immagini
start.bat       # Avvia i container
```

### 4. Accedi all'applicazione

- **Frontend**: http://localhost:81
- **Backend API**: http://localhost:81/api

### 5. Crea il primo utente (via PHPMyAdmin o SQL)

```sql
-- Via PHPMyAdmin (http://localhost:8080)
-- Database: coredocument
-- Table: users

INSERT INTO users (email, password, name, role) VALUES (
  'admin@coredocument.com',
  '$2b$10$hash_della_password',  -- Usa bcrypt per hashare "admin123"
  'Admin',
  'ADMIN'
);
```

O usa questo comando per generare l'hash:
```bash
docker exec coredocument-backend node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(console.log);"
```

## 📋 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - User info

### Documents
- `GET /api/documents` - Lista documenti (filtri: supplier, docNumber, date, month, year, page, limit)
- `POST /api/documents` - Upload (multipart/form-data: file, supplier, docNumber, date)
- `GET /api/documents/:id` - Dettaglio
- `PATCH /api/documents/:id` - Aggiorna metadati
- `DELETE /api/documents/:id` - Elimina
- `GET /api/documents/:id/download` - Download (streaming)
- `GET /api/documents/:id/download-url` - URL firmato MinIO

### Favorites
- `GET /api/favorites` - Lista preferiti
- `POST /api/favorites` - Aggiungi (body: {documentId})
- `DELETE /api/favorites/:documentId` - Rimuovi
- `POST /api/favorites/:documentId/toggle` - Toggle
- `GET /api/favorites/:documentId/check` - Verifica se è preferito

### Search
- `GET /api/search?q=...&supplier=...&year=...` - Ricerca full-text

## 🔧 Sviluppo

### Backend
```bash
# In locale (senza Docker)
cd apps/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
# In locale (senza Docker)
cd apps/frontend
npm install
npm run dev
```

### Rebuild dopo modifiche
```bash
build.bat backend   # Solo backend
build.bat frontend  # Solo frontend
build.bat          # Tutto
```

## 🗄️ Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  favorites Favorite[]
}

model Document {
  id             Int      @id @default(autoincrement())
  filename       String
  minioKey       String   @unique  // Path in MinIO
  supplier       String
  docNumber      String
  date           DateTime
  month          String
  year           Int
  fileSize       BigInt
  fileExtension  String
  meilisearchId  String?
  favorites      Favorite[]
}

model Favorite {
  id         Int      @id @default(autoincrement())
  userId     Int
  documentId Int
  user       User     @relation(...)
  document   Document @relation(...)
}
```

## 🔐 Variabili d'Ambiente (.env)

```env
# Database (CoreServices)
MYSQL_DATABASE=coredocument
MYSQL_USER=coredocument
MYSQL_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# MinIO (CoreServices)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Meilisearch (CoreServices)
MEILI_MASTER_KEY=masterKeyChangeThis

# Application
APP_URL=http://localhost:81
NEXT_PUBLIC_API_URL=http://localhost:81/api
```

## 📦 Porte Utilizzate

| Servizio | Porta | URL |
|----------|-------|-----|
| Frontend (interno) | 3003 | - |
| Backend | 3002 | http://localhost:3002/api |
| Nginx | 81 | http://localhost:81 |

## ✨ Prossimi Step

1. **Adatta il frontend**
   - Personalizza componenti copiati da CoreMachine
   - Implementa pagine specifiche per documenti
   - Aggiungi visualizzatore PDF

2. **Features aggiuntive**
   - Scanner filesystem per importare documenti esistenti
   - Statistiche e dashboard
   - Esportazione dati
   - Notifiche scadenze
   - OCR per estrarre testo da PDF

3. **Testing**
   - Unit tests backend
   - E2E tests con Playwright
   - Load testing

4. **Deploy**
   - Usa `DEPLOY.md` nella root per deploy su server Ubuntu
   - Configura HTTPS con certificati SSL
   - Setup backup automatici

## 🆘 Troubleshooting

### Backend non si connette a MySQL
```bash
# Verifica che CoreServices sia attivo
docker ps | grep core-mysql

# Verifica le credenziali nel .env
```

### Frontend non chiama l'API
```bash
# Rebuild con --no-cache per forzare l'aggiornamento delle variabili
build.bat --no-cache frontend
```

### Errori Prisma
```bash
# Rigenera il client Prisma
docker exec coredocument-backend npx prisma generate

# Applica le migrations
docker exec coredocument-backend npx prisma migrate deploy
```

## 📚 Risorse

- **NestJS**: https://nestjs.com
- **Next.js**: https://nextjs.org
- **Prisma**: https://prisma.io
- **MinIO**: https://min.io
- **Meilisearch**: https://meilisearch.com
