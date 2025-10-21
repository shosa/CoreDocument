# 🚀 Quick Start - Import Documenti Legacy

Guida rapida per importare documenti dalla cartella `Y:\` al nuovo sistema CoreDocument.

## ⚡ Setup Veloce (5 minuti)

### 1. Installa dipendenze

```bash
cd scripts
npm install
```

### 2. Ottieni JWT Token

**Metodo più veloce (cURL):**

```bash
# Login
curl -X POST http://localhost:81/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"yourpassword\"}"
```

Copia il valore di `accessToken`.

**Alternativa (Browser):**
1. Apri http://localhost:81
2. Fai login
3. F12 → Console
4. `localStorage.getItem('token')`

### 3. Test (OBBLIGATORIO)

```bash
# Test funzioni di parsing
npm test

# Dry run (simulazione completa)
node import-legacy-documents.js --dry-run --source Y:\
```

### 4. Import Test su 1 Mese

```bash
node import-legacy-documents.js --test --year 2023 --month GENNAIO --source Y:\ --token YOUR_JWT_TOKEN
```

**Verifica risultati:**
- Apri http://localhost:81
- Vai su "Documenti"
- Filtra per anno 2023
- Dovresti vedere i documenti di Gennaio

### 5. Import Completo

Se il test è OK, procedi con tutto:

```bash
node import-legacy-documents.js --source Y:\ --token YOUR_JWT_TOKEN --verbose
```

## 📊 Cosa Aspettarsi

**Per ~10.000 documenti:**
- ⏱️ Tempo: ~2-3 ore
- 💾 Spazio MinIO: ~5-10 GB (dipende da dimensione file)
- 🔄 Progress bar in tempo reale
- 📝 Log dettagliato in `import-log.json`

**Output esempio:**

```
╔════════════════════════════════════════════════════════╗
║   CoreDocument - Import Massivo Documenti Legacy      ║
╚════════════════════════════════════════════════════════╝

🔍 Scansione documenti in corso...

████████████████████████░░░░░ | 65% | 6500/10000 | 6450 OK, 50 ERR

╔════════════════════════════════════════════════════════╗
║                  RISULTATI IMPORT                      ║
╚════════════════════════════════════════════════════════╝

Statistiche:
  File scansionati:       12000
  Documenti trovati:      10000
  Invalidi/Skippati:      80
  Già esistenti:          0
  ✅ Upload riusciti:     9920
  ❌ Upload falliti:      0
  Durata:                 7200s (2 ore)

✅ Import completato!
```

## 🛑 Se Qualcosa Va Storto

### Errore: "JWT token richiesto"
```bash
# Ottieni nuovo token
curl -X POST http://localhost:81/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"password\"}"
```

### Errore: "ENOENT" o "Path non trovato"
```bash
# Verifica accesso a Y:\
dir Y:\

# Se Y:\ non esiste, cambia path
node import-legacy-documents.js --source "\\server\share\documenti" --token ...
```

### Errore: "401 Unauthorized" (token scaduto)
```bash
# Rigenera token (step 2)
# Riavvia import (riparte da dove si era fermato)
```

### Import si blocca/rallenta
```bash
# Riduci batch size
node import-legacy-documents.js --source Y:\ --token ... --batch-size 10
```

### Interrompere e Riprendere
```bash
# Premi Ctrl+C per interrompere
# Riavvia con stesso comando
# Skipperà automaticamente documenti già importati ✅
```

## ✅ Verifica Post-Import

### Via Browser
1. Apri http://localhost:81
2. Vai su "Documenti"
3. Controlla numero totale documenti

### Via Database
```bash
# Accedi a MySQL
docker exec -it core-mysql mysql -uroot -prootpassword coredocument

# Query verifica
SELECT COUNT(*) FROM documents;
SELECT year, COUNT(*) FROM documents GROUP BY year;
```

### Via Meilisearch
```bash
# Verifica indicizzazione
curl http://localhost:7700/indexes/documents/stats -H "Authorization: Bearer masterKeyChangeThis"
```

## 📁 File Generati

- `import-log.json` - Log completo con dettagli errori
- `node_modules/` - Dipendenze npm (ignorato da git)

## 💡 Tips

1. **Esegui sempre prima il test** su un mese
2. **Usa --verbose** per vedere cosa succede in real-time
3. **Controlla import-log.json** per dettagli errori
4. **Backup database** prima di import massivo:
   ```bash
   docker exec core-mysql mysqldump -uroot -prootpassword coredocument > backup.sql
   ```

## 🎯 Checklist

Prima di iniziare, verifica:

- [ ] CoreServices attivo (`docker ps`)
- [ ] CoreDocument attivo (http://localhost:81 risponde)
- [ ] `npm install` eseguito
- [ ] `npm test` passato (tutti ✅)
- [ ] Dry run completato con successo
- [ ] Test su 1 mese completato con successo
- [ ] JWT token ottenuto e valido
- [ ] Backup database fatto

## 📞 Aiuto

**Documentazione completa:** [README.md](README.md)

**File log:** `import-log.json` (generato automaticamente)

**Verifica configurazione:**
```bash
# Verifica CoreDocument
curl http://localhost:81/api/documents -H "Authorization: Bearer YOUR_TOKEN"

# Verifica MinIO
curl http://localhost:9000/minio/health/live

# Verifica Meilisearch
curl http://localhost:7700/health
```

---

**🎉 Buon Import!**
