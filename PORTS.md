# CoreDocument - Configurazione Porte

Documentazione completa delle porte utilizzate in sviluppo e produzione.

## 🏗️ Sviluppo Locale (npm run dev)

### Frontend (Next.js)
```bash
cd apps/frontend
npm run dev
```

- **Porta**: `3000`
- **Accesso**: http://localhost:3000
- **API calls**: `/api/*` → Next.js fa **proxy automatico** a `http://localhost:3003/api/*`
- **Config**: `next.config.mjs` → `rewrites()` attivo solo in `NODE_ENV=development`

### Backend (NestJS)
```bash
cd apps/backend
npm run dev
```

- **Porta**: `3003`
- **Accesso**: http://localhost:3003/api
- **Config**: `.env` → `APP_PORT=3003`

### Workflow Sviluppo

```
Browser → http://localhost:3000
    ↓
Next.js Dev Server (porta 3000)
    ↓ Richiesta a /api/documents
Next.js Proxy (rewrites)
    ↓ http://localhost:3003/api/documents
NestJS Backend (porta 3003)
```

**Vantaggi**:
- ✅ Nessun problema CORS
- ✅ URL API sempre `/api` (no hardcode hostname)
- ✅ Hot reload funziona per frontend e backend

---

## 🐳 Docker (Produzione)

### Architettura

```
Client Browser
    ↓
http://localhost:81
    ↓
Nginx Container (porta 81)
    ├─→ /api/*  → backend:3003
    └─→ /*      → frontend:3000
```

### Container Mapping

| Container | Porta Interna | Porta Host | Descrizione |
|-----------|---------------|------------|-------------|
| **frontend** | 3000 | 3002 | Next.js (standalone) |
| **backend** | 3003 | 3003 | NestJS API |
| **nginx** | 80 | 81 | Reverse proxy |

### Configurazione

#### docker-compose.yml
```yaml
backend:
  ports:
    - "3003:3003"  # Host:Container

frontend:
  ports:
    - "3002:3000"  # Host:Container

nginx:
  ports:
    - "81:80"      # Host:Container
```

#### nginx/nginx.conf
```nginx
upstream backend {
    server backend:3003;  # Porta INTERNA del container
}

upstream frontend {
    server frontend:3000; # Porta INTERNA del container
}
```

### Accesso Produzione

| URL | Routing | Descrizione |
|-----|---------|-------------|
| http://localhost:81 | nginx → frontend:3000 | **Accesso principale** |
| http://localhost:81/api | nginx → backend:3003 | API tramite nginx |
| http://localhost:3002 | frontend:3000 diretto | Debug frontend |
| http://localhost:3003/api | backend:3003 diretto | Debug backend |

---

## 🔧 Troubleshooting

### Frontend non raggiunge il backend in dev

**Sintomo**: Errori CORS o 404 su chiamate `/api/*`

**Soluzione**:
1. Verifica che backend sia attivo su porta 3003:
   ```bash
   curl http://localhost:3003/api
   ```

2. Verifica configurazione proxy in `next.config.mjs`:
   ```javascript
   async rewrites() {
     if (process.env.NODE_ENV === 'development') {
       return [
         {
           source: '/api/:path*',
           destination: 'http://localhost:3003/api/:path*',
         },
       ];
     }
     return [];
   }
   ```

3. Verifica variabile env nel frontend:
   ```bash
   # apps/frontend/.env
   NEXT_PUBLIC_API_URL=/api
   ```

4. Riavvia Next.js dev server:
   ```bash
   cd apps/frontend
   npm run dev
   ```

### Frontend non raggiunge il backend in Docker

**Sintomo**: 502 Bad Gateway o timeout

**Soluzione**:
1. Verifica che tutti i container siano attivi:
   ```bash
   docker ps
   # Dovresti vedere: coredocument-backend, coredocument-frontend, coredocument-nginx
   ```

2. Verifica porte in `docker-compose.yml`:
   ```yaml
   backend:
     ports:
       - "3003:3003"  # Deve matchare APP_PORT nel container
   ```

3. Verifica nginx upstream:
   ```bash
   # nginx/nginx.conf
   upstream backend {
       server backend:3003;  # Nome container + porta interna
   }
   ```

4. Controlla logs:
   ```bash
   docker logs coredocument-backend
   docker logs coredocument-nginx
   ```

5. Rebuild containers:
   ```bash
   docker-compose -p coredocument down
   docker-compose -p coredocument up -d --build
   ```

### Porta già in uso

**Sintomo**: `Error: listen EADDRINUSE: address already in use :::3003`

**Soluzione**:
```bash
# Windows
netstat -ano | findstr :3003
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3003 | xargs kill -9
```

---

## 📋 Checklist Configurazione

### File da Verificare

- [ ] `.env` → `APP_PORT=3003`
- [ ] `apps/frontend/.env` → `NEXT_PUBLIC_API_URL=/api`
- [ ] `apps/backend/.env` → `APP_PORT=3003`
- [ ] `docker-compose.yml` → Backend `3003:3003`, Frontend `3002:3000`
- [ ] `nginx/nginx.conf` → `server backend:3003`
- [ ] `apps/frontend/next.config.mjs` → `rewrites()` configurato

### Test Sviluppo

```bash
# 1. Avvia backend
cd apps/backend
npm run dev
# Verifica: http://localhost:3003/api

# 2. Avvia frontend
cd apps/frontend
npm run dev
# Verifica: http://localhost:3000

# 3. Test chiamata API
curl http://localhost:3000/api/documents
# Dovrebbe fare proxy a backend:3003
```

### Test Docker

```bash
# 1. Build e avvia
docker-compose -p coredocument up -d --build

# 2. Verifica container
docker ps | grep coredocument

# 3. Test nginx
curl http://localhost:81
curl http://localhost:81/api

# 4. Test porte dirette
curl http://localhost:3002  # Frontend
curl http://localhost:3003/api  # Backend
```

---

## 🎯 Riepilogo Rapido

| Modalità | Frontend | Backend | Accesso Principale |
|----------|----------|---------|-------------------|
| **Sviluppo** | :3000 | :3003 | http://localhost:3000 (con proxy) |
| **Docker** | :3002 (host) | :3003 (host) | http://localhost:81 (nginx) |

**Regola d'oro**: In dev il frontend fa proxy, in Docker nginx fa proxy!
