# Script di Import Massivo - CoreDocument

Script per importare documenti dalla vecchia struttura legacy al nuovo sistema CoreDocument.

## 📋 Prerequisiti

1. **CoreServices attivo**
   ```bash
   cd ../CoreServices
   start.bat
   ```

2. **CoreDocument attivo**
   ```bash
   cd ../CoreDocument
   start.bat
   ```

3. **Node.js installato** (v18+)

4. **Accesso alla cartella legacy** (es. `Y:\`)

## 🚀 Installazione

```bash
cd scripts
npm install
```

## 🔑 Ottenere il Token JWT

Prima di eseguire l'import, devi ottenere un token JWT:

### Opzione 1: Via cURL (consigliato)

```bash
# 1. Registra un utente admin (solo prima volta)
curl -X POST http://localhost:81/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"import@admin.com\",\"password\":\"ImportPass123!\",\"name\":\"Import Script\",\"role\":\"ADMIN\"}"

# 2. Login e ottieni il token
curl -X POST http://localhost:81/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"import@admin.com\",\"password\":\"ImportPass123!\"}"
```

Copia il valore di `accessToken` dalla risposta.

### Opzione 2: Via Browser

1. Apri http://localhost:81/login
2. Fai login con un account admin
3. Apri DevTools (F12) → Console
4. Esegui: `localStorage.getItem('token')`
5. Copia il token

### Opzione 3: Via Environment Variable

```bash
# Windows CMD
set COREDOCUMENT_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Windows PowerShell
$env:COREDOCUMENT_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Linux/Mac
export COREDOCUMENT_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Test

Prima di eseguire l'import, testa le funzioni di parsing:

```bash
npm test
```

Dovrebbe mostrare tutti i test passati (✅).

## 📦 Utilizzo

### 1. Dry Run (Simulazione)

Simula l'import senza uploadare file reali:

```bash
node import-legacy-documents.js --dry-run --source Y:\
```

### 2. Test su Subset (Consigliato)

Testa su un solo mese prima di importare tutto:

```bash
node import-legacy-documents.js ^
  --test ^
  --year 2023 ^
  --month GENNAIO ^
  --source Y:\ ^
  --token YOUR_JWT_TOKEN
```

### 3. Import Completo

Dopo aver verificato che il test funziona:

```bash
node import-legacy-documents.js ^
  --source Y:\ ^
  --token YOUR_JWT_TOKEN ^
  --verbose
```

### 4. Con Environment Variable

Se hai impostato `COREDOCUMENT_JWT_TOKEN`:

```bash
node import-legacy-documents.js --source Y:\
```

## ⚙️ Opzioni

| Opzione | Descrizione | Default |
|---------|-------------|---------|
| `-s, --source <path>` | Path sorgente documenti | `Y:\` |
| `-u, --api-url <url>` | URL API backend | `http://localhost:81/api` |
| `-t, --token <token>` | JWT token autenticazione | `$COREDOCUMENT_JWT_TOKEN` |
| `-b, --batch-size <n>` | Dimensione batch upload | `20` |
| `--dry-run` | Simula import senza uploadare | - |
| `--test` | Modalità test (filtra anno/mese) | - |
| `--year <year>` | Filtra per anno (con --test) | - |
| `--month <month>` | Filtra per mese (con --test) | - |
| `-v, --verbose` | Log dettagliato | - |

## 📊 Output

Durante l'esecuzione vedrai:

```
╔════════════════════════════════════════════════════════╗
║   CoreDocument - Import Massivo Documenti Legacy      ║
╚════════════════════════════════════════════════════════╝

Configurazione:
  Source:     Y:\
  API URL:    http://localhost:81/api
  Batch size: 20
  Dry run:    NO
  Test mode:  NO

🔍 Scansione documenti in corso...

████████████████████████░░░░░ | 65% | 1234/1890 | 1200 OK, 34 ERR

╔════════════════════════════════════════════════════════╗
║                  RISULTATI IMPORT                      ║
╚════════════════════════════════════════════════════════╝

Statistiche:
  File scansionati:       10500
  Documenti trovati:      8920
  Invalidi/Skippati:      120
  Già esistenti:          50
  ✅ Upload riusciti:     8750
  ❌ Upload falliti:      0
  Durata:                 1850s

✅ Log salvato in: ./import-log.json
✅ Import completato!
```

## 📄 Log File

Ogni esecuzione crea un file `import-log.json` con dettagli completi:

```json
{
  "startTime": "2025-10-20T10:30:00.000Z",
  "endTime": "2025-10-20T11:00:00.000Z",
  "duration": 1800,
  "total": 8920,
  "scanned": 10500,
  "skipped": 120,
  "invalid": 50,
  "alreadyExists": 50,
  "success": 8750,
  "failed": 0,
  "errors": []
}
```

## 🐛 Risoluzione Problemi

### Errore: "JWT token richiesto"

Soluzione: Passa il token con `--token` o imposta `COREDOCUMENT_JWT_TOKEN`

### Errore: "401 Unauthorized"

Soluzione: Il token è scaduto. Genera un nuovo token facendo login.

### Errore: "ENOENT: no such file or directory"

Soluzione: Verifica che il path sorgente sia corretto e accessibile.

### Errore: "413 Payload Too Large"

Soluzione: Riduci il batch size: `--batch-size 10`

### Errore: "ETIMEDOUT" o "ECONNRESET"

Soluzione:
1. Verifica che CoreDocument backend sia attivo
2. Riduci batch size
3. Lo script riproverà automaticamente (max 3 tentativi)

### Alcuni file non vengono importati

Soluzione:
1. Controlla il log in `import-log.json` → `errors`
2. I file devono seguire il pattern: `FORNITORE NUMERO.pdf`
3. Le cartelle devono seguire: `ANNO/MESE/DD-MM-YYYY/`

## 📁 Struttura Sorgente Supportata

```
Y:\
├── 2023\
│   ├── GENNAIO\
│   │   ├── 01-01-2023\
│   │   │   ├── ABC RICAMI 1894.pdf
│   │   │   └── ALVIPEL 2137.pdf
│   │   ├── 02-01-2023\
│   │   │   └── FORNITORE 12345.pdf
│   │   └── ...
│   ├── FEBBRAIO\
│   └── ...
├── 2024\
└── 2025\
```

### Naming Convention File

**Pattern:** `FORNITORE NUMERO.estensione`

**Esempi validi:**
- `ABC RICAMI 1894.pdf`
- `ATELIER AMELIER 162.pdf`
- `VALENTINO 9000028669.pdf`
- `TOD'S 2409.pdf`
- `FORNITORE TEST 123.jpg`

**Esempi NON validi:**
- `DOCUMENTO.pdf` (manca numero)
- `12345.pdf` (manca fornitore)
- `FORNITORE-123.pdf` (separatore errato)

### Estensioni Supportate

- `.pdf`
- `.jpg`
- `.jpeg`
- `.png`

## 🔄 Riprendere Import Interrotto

Lo script supporta `skipExisting` (abilitato di default), quindi:

1. Interrompi lo script (Ctrl+C)
2. Riavvialo con gli stessi parametri
3. Skipperà automaticamente i documenti già importati

## ⚡ Performance

**Stima per 10.000 documenti:**
- Batch size: 20
- Batches totali: 500
- Tempo medio per batch: ~15s
- **Tempo totale: ~2 ore**

**Ottimizzazioni:**
- Aumenta `--batch-size` se hai una buona connessione (max 50)
- Esegui lo script sulla stessa macchina del backend
- Assicurati che MinIO abbia disco veloce (SSD)

## 📞 Supporto

Per problemi o domande:
1. Controlla `import-log.json` per dettagli errori
2. Esegui con `--verbose` per log dettagliato
3. Verifica che CoreServices e CoreDocument siano attivi

## 🎯 Checklist Pre-Import

- [ ] CoreServices attivo (`docker ps` mostra mysql, minio, meilisearch)
- [ ] CoreDocument attivo (http://localhost:81 accessibile)
- [ ] Token JWT ottenuto e valido
- [ ] Accesso a cartella sorgente (es. `Y:\`)
- [ ] Test script eseguito (`npm test` → tutti ✅)
- [ ] Dry run eseguito e verificato
- [ ] Test su subset (un mese) completato con successo
- [ ] Backup database fatto (`mysqldump coredocument`)
- [ ] Spazio disponibile su MinIO verificato

## 📝 Esempio Completo

```bash
# 1. Installa dipendenze
cd scripts
npm install

# 2. Testa le funzioni
npm test

# 3. Ottieni JWT token
curl -X POST http://localhost:81/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"yourpassword\"}"

# 4. Dry run
node import-legacy-documents.js --dry-run --source Y:\

# 5. Test su un mese
node import-legacy-documents.js ^
  --test --year 2023 --month GENNAIO ^
  --source Y:\ ^
  --token YOUR_JWT_TOKEN

# 6. Import completo
node import-legacy-documents.js ^
  --source Y:\ ^
  --token YOUR_JWT_TOKEN ^
  --verbose
```

## 🎉 Dopo l'Import

Verifica i dati importati:

```bash
# Accedi a PHPMyAdmin
http://localhost:8080

# Oppure via MySQL CLI
docker exec -it core-mysql mysql -uroot -prootpassword coredocument

# Query di verifica
SELECT COUNT(*) FROM documents;
SELECT year, COUNT(*) FROM documents GROUP BY year;
SELECT supplier, COUNT(*) FROM documents GROUP BY supplier ORDER BY COUNT(*) DESC LIMIT 20;
```

Verifica Meilisearch:

```bash
# Controlla indice
curl http://localhost:7700/indexes/documents/stats ^
  -H "Authorization: Bearer masterKeyChangeThis"
```

## 📚 Note Aggiuntive

- Lo script ignora automaticamente cartelle con pattern `%d-%m-%Y` (bug legacy)
- I file duplicati (stesso fornitore/numero/data) vengono skippati
- Il retry automatico gestisce errori temporanei di rete
- Il log completo è sempre salvato in `import-log.json`
