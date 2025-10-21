#!/usr/bin/env node

/**
 * Script di Import Massivo Documenti Legacy per CoreDocument
 *
 * Importa documenti dalla struttura legacy:
 *   Y:\ANNO\MESE\DD-MM-YYYY\FORNITORE NUMERO.pdf
 *
 * Verso il nuovo sistema CoreDocument (MySQL + MinIO + Meilisearch)
 *
 * Usage:
 *   node import-legacy-documents.js --source Y:\ --token YOUR_JWT_TOKEN
 *   node import-legacy-documents.js --dry-run
 *   node import-legacy-documents.js --test --year 2023 --month GENNAIO
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const cliProgress = require('cli-progress');
const colors = require('colors');
const { program } = require('commander');

// ============================================================================
// CONFIGURAZIONE
// ============================================================================

const DEFAULT_CONFIG = {
  sourcePath: 'Y:\\',
  apiUrl: 'http://localhost:81/api',
  authToken: process.env.COREDOCUMENT_JWT_TOKEN || '',
  batchSize: 20, // Ridotto a 20 per evitare timeout
  extensions: ['.pdf', '.jpg', '.png', '.jpeg'],
  skipExisting: true,
  maxRetries: 3,
  retryDelay: 2000,
  logFile: './import-log.json',
};

// ============================================================================
// PARSING ARGUMENTS
// ============================================================================

program
  .name('import-legacy-documents')
  .description('Import massivo documenti legacy in CoreDocument')
  .version('1.0.0')
  .option('-s, --source <path>', 'Path sorgente documenti', DEFAULT_CONFIG.sourcePath)
  .option('-u, --api-url <url>', 'URL API backend', DEFAULT_CONFIG.apiUrl)
  .option('-t, --token <token>', 'JWT token autenticazione', DEFAULT_CONFIG.authToken)
  .option('-b, --batch-size <number>', 'Dimensione batch upload', parseInt, DEFAULT_CONFIG.batchSize)
  .option('--dry-run', 'Simula import senza uploadare')
  .option('--test', 'Modalità test (solo un mese)')
  .option('--year <year>', 'Filtra per anno (con --test)')
  .option('--month <month>', 'Filtra per mese (con --test)')
  .option('-v, --verbose', 'Log dettagliato')
  .parse();

const options = program.opts();
const CONFIG = { ...DEFAULT_CONFIG, ...options };

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep per N millisecondi
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mappa mesi italiani -> inglesi
 */
const MONTH_MAP = {
  'GENNAIO': 'January',
  'FEBBRAIO': 'February',
  'MARZO': 'March',
  'APRILE': 'April',
  'MAGGIO': 'May',
  'GIUGNO': 'June',
  'LUGLIO': 'July',
  'AGOSTO': 'August',
  'SETTEMBRE': 'September',
  'OTTOBRE': 'October',
  'NOVEMBRE': 'November',
  'DICEMBRE': 'December',
};

/**
 * Valida se una cartella è un mese valido
 */
function isValidMonth(monthName) {
  return MONTH_MAP.hasOwnProperty(monthName.toUpperCase());
}

/**
 * Converti mese italiano in inglese
 */
function normalizeMonth(monthName) {
  return MONTH_MAP[monthName.toUpperCase()] || monthName;
}

/**
 * Parse filename: "ABC RICAMI 1894.pdf" → { supplier, docNumber, extension }
 */
function parseFilename(filename) {
  // Rimuovi estensione
  const match = filename.match(/^(.+?)\.([a-z]{3,4})$/i);
  if (!match) return null;

  const [, nameWithoutExt, extension] = match;

  // Trova l'ultimo numero (che dovrebbe essere il docNumber)
  const numberMatch = nameWithoutExt.match(/^(.+?)\s+(\d+)$/);
  if (!numberMatch) {
    console.warn(colors.yellow(`⚠️  Filename non standard: ${filename}`));
    return null;
  }

  const [, supplier, docNumber] = numberMatch;

  return {
    supplier: supplier.trim(),
    docNumber: docNumber.trim(),
    extension: extension.toLowerCase(),
  };
}

/**
 * Parse date folder: "01-08-2023" → Date(2023-08-01)
 */
function parseDate(folderName) {
  // Ignora cartelle con pattern %d-%m-%Y (bug legacy)
  if (folderName.includes('%')) {
    return null;
  }

  const match = folderName.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;

  // Valida data
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Estrai metadata da path completo
 * Supporta entrambi i formati:
 * - Y:\2023\GENNAIO\02-01-2023\ABC RICAMI 1894.pdf
 * - Y:\DDT\2023\GENNAIO\02-01-2023\ABC RICAMI 1894.pdf
 */
function extractMetadata(filePath, sourcePath) {
  try {
    // Normalizza path
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedSource = sourcePath.replace(/\\/g, '/');

    // Rimuovi source path
    const relativePath = normalizedPath.replace(normalizedSource, '').replace(/^\//, '');
    const parts = relativePath.split('/');

    // Deve avere almeno 4 parti: ANNO/MESE/DATA/FILE
    // Oppure 5 se c'è cartella DDT: DDT/ANNO/MESE/DATA/FILE
    if (parts.length < 4) return null;

    // Se la prima parte è "DDT", salta
    let offset = 0;
    if (parts[0].toUpperCase() === 'DDT') {
      offset = 1;
      if (parts.length < 5) return null; // Serve 5 parti con DDT
    }

    const year = parts[0 + offset];
    const month = parts[1 + offset];
    const dateFolder = parts[2 + offset];
    const filename = parts[parts.length - 1];

    // Valida anno (deve essere numero)
    if (!/^\d{4}$/.test(year)) return null;

    // Valida mese
    if (!isValidMonth(month)) return null;

    // Normalizza mese (italiano -> inglese)
    const normalizedMonth = normalizeMonth(month);

    // Parse date
    const date = parseDate(dateFolder);
    if (!date) return null;

    // Parse filename
    const parsed = parseFilename(filename);
    if (!parsed) return null;

    return {
      supplier: parsed.supplier,
      docNumber: parsed.docNumber,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      filePath: filePath,
      filename: filename,
      year: parseInt(year),
      month: normalizedMonth, // Usa mese normalizzato in inglese
    };
  } catch (error) {
    console.error(colors.red(`Errore parsing ${filePath}:`), error.message);
    return null;
  }
}

/**
 * Scansiona directory ricorsivamente
 */
async function* walkDirectory(dir, filter = null) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Applica filtro (per modalità test)
        if (filter && filter.year && entry.name !== filter.year.toString()) {
          continue;
        }
        if (filter && filter.month && entry.name.toUpperCase() !== filter.month.toUpperCase()) {
          continue;
        }

        yield* walkDirectory(fullPath, filter);
      } else {
        yield fullPath;
      }
    }
  } catch (error) {
    console.error(colors.red(`Errore lettura directory ${dir}:`), error.message);
  }
}

/**
 * Verifica se un documento esiste già nel DB
 */
async function checkDocumentExists(supplier, docNumber, date) {
  if (!CONFIG.skipExisting) return false;

  try {
    const response = await axios.get(`${CONFIG.apiUrl}/documents`, {
      params: {
        supplier,
        docNumber,
        date,
        limit: 1,
      },
      headers: {
        'Authorization': `Bearer ${CONFIG.authToken}`,
      },
    });

    return response.data.data.length > 0;
  } catch (error) {
    // In caso di errore, assume non esistente
    return false;
  }
}

/**
 * Upload batch di file via API
 */
async function uploadBatch(files, metadataList) {
  const formData = new FormData();

  // Aggiungi tutti i file
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fileStream = require('fs').createReadStream(filePath);
    formData.append('files', fileStream, path.basename(filePath));
  }

  // Aggiungi metadata come JSON string
  const metadata = metadataList.map(m => ({
    supplier: m.supplier,
    docNumber: m.docNumber,
    date: m.date,
  }));

  formData.append('metadata', JSON.stringify(metadata));

  // Upload con retry
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${CONFIG.apiUrl}/documents/bulk-upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${CONFIG.authToken}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 60000, // 60 secondi timeout
        }
      );

      return response.data;
    } catch (error) {
      if (attempt === CONFIG.maxRetries) {
        throw error;
      }

      console.warn(colors.yellow(`⚠️  Tentativo ${attempt} fallito, retry in ${CONFIG.retryDelay}ms...`));
      await sleep(CONFIG.retryDelay * attempt); // Exponential backoff
    }
  }
}

/**
 * Salva log su file
 */
async function saveLog(stats) {
  try {
    await fs.writeFile(CONFIG.logFile, JSON.stringify(stats, null, 2));
    console.log(colors.green(`\n✅ Log salvato in: ${CONFIG.logFile}`));
  } catch (error) {
    console.error(colors.red('Errore salvataggio log:'), error.message);
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  console.log(colors.cyan.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(colors.cyan.bold('║   CoreDocument - Import Massivo Documenti Legacy      ║'));
  console.log(colors.cyan.bold('╚════════════════════════════════════════════════════════╝\n'));

  // Validazione configurazione
  if (!CONFIG.authToken && !options.dryRun) {
    console.error(colors.red('❌ Errore: JWT token richiesto!'));
    console.log(colors.yellow('\nUsa: --token YOUR_JWT_TOKEN'));
    console.log(colors.yellow('Oppure: export COREDOCUMENT_JWT_TOKEN=YOUR_JWT_TOKEN\n'));
    process.exit(1);
  }

  console.log(colors.white('Configurazione:'));
  console.log(colors.gray(`  Source:     ${CONFIG.sourcePath}`));
  console.log(colors.gray(`  API URL:    ${CONFIG.apiUrl}`));
  console.log(colors.gray(`  Batch size: ${CONFIG.batchSize}`));
  console.log(colors.gray(`  Dry run:    ${options.dryRun ? 'SI' : 'NO'}`));
  console.log(colors.gray(`  Test mode:  ${options.test ? 'SI' : 'NO'}`));
  if (options.test) {
    console.log(colors.gray(`  Filtro:     ${options.year || 'tutti gli anni'} / ${options.month || 'tutti i mesi'}`));
  }
  console.log('');

  // Stats
  const stats = {
    startTime: new Date().toISOString(),
    total: 0,
    scanned: 0,
    skipped: 0,
    invalid: 0,
    alreadyExists: 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Batch corrente
  let batch = [];
  let batchMetadata = [];

  // Progress bar
  const progressBar = new cliProgress.SingleBar({
    format: colors.cyan('{bar}') + ' | {percentage}% | {value}/{total} | {status}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  let progressStarted = false;

  // Filtro per test mode
  const filter = options.test ? {
    year: options.year,
    month: options.month,
  } : null;

  console.log(colors.yellow('🔍 Scansione documenti in corso...\n'));

  try {
    // Scansiona tutti i file
    for await (const filePath of walkDirectory(CONFIG.sourcePath, filter)) {
      stats.scanned++;

      // Filtra per estensione
      const ext = path.extname(filePath).toLowerCase();
      if (!CONFIG.extensions.includes(ext)) {
        continue;
      }

      stats.total++;

      // Estrai metadata
      const metadata = extractMetadata(filePath, CONFIG.sourcePath);
      if (!metadata) {
        stats.invalid++;
        stats.errors.push({
          file: filePath,
          error: 'Invalid path structure or filename',
        });
        continue;
      }

      if (options.verbose) {
        console.log(colors.gray(`  ${metadata.filename} → ${metadata.supplier} #${metadata.docNumber} (${metadata.date})`));
      }

      // Check se esiste già (solo se non dry-run)
      if (!options.dryRun && CONFIG.skipExisting) {
        const exists = await checkDocumentExists(metadata.supplier, metadata.docNumber, metadata.date);
        if (exists) {
          stats.alreadyExists++;
          stats.skipped++;
          continue;
        }
      }

      // Aggiungi a batch
      batch.push(filePath);
      batchMetadata.push(metadata);

      // Upload quando batch è pieno
      if (batch.length >= CONFIG.batchSize) {
        if (!progressStarted) {
          progressBar.start(stats.total, 0, { status: 'Uploading...' });
          progressStarted = true;
        }

        if (options.dryRun) {
          // Dry run: simula upload
          stats.success += batch.length;
          if (options.verbose) {
            console.log(colors.gray(`[DRY-RUN] Batch di ${batch.length} file simulato`));
          }
        } else {
          // Upload reale
          try {
            const result = await uploadBatch(batch, batchMetadata);
            stats.success += result.success || 0;
            stats.failed += result.failed || 0;

            if (result.errors && result.errors.length > 0) {
              stats.errors.push(...result.errors);
            }

            progressBar.update(stats.success + stats.failed, {
              status: `${stats.success} OK, ${stats.failed} ERR`
            });
          } catch (error) {
            stats.failed += batch.length;
            stats.errors.push({
              batch: batch.map(f => path.basename(f)),
              error: error.response?.data?.message || error.message,
            });

            console.error(colors.red(`\n❌ Errore upload batch: ${error.message}`));
          }
        }

        // Reset batch
        batch = [];
        batchMetadata = [];

        // Pausa per non sovraccaricare il server
        await sleep(500);
      }
    }

    // Upload batch residuo
    if (batch.length > 0) {
      if (!progressStarted) {
        progressBar.start(stats.total, 0, { status: 'Uploading...' });
        progressStarted = true;
      }

      if (options.dryRun) {
        stats.success += batch.length;
      } else {
        try {
          const result = await uploadBatch(batch, batchMetadata);
          stats.success += result.success || 0;
          stats.failed += result.failed || 0;

          if (result.errors && result.errors.length > 0) {
            stats.errors.push(...result.errors);
          }
        } catch (error) {
          stats.failed += batch.length;
          stats.errors.push({
            batch: batch.map(f => path.basename(f)),
            error: error.response?.data?.message || error.message,
          });
        }
      }

      progressBar.update(stats.success + stats.failed, {
        status: 'Completato'
      });
    }

    if (progressStarted) {
      progressBar.stop();
    }

    stats.endTime = new Date().toISOString();
    stats.duration = Math.round((new Date(stats.endTime) - new Date(stats.startTime)) / 1000);

    // Risultati finali
    console.log(colors.cyan.bold('\n╔════════════════════════════════════════════════════════╗'));
    console.log(colors.cyan.bold('║                  RISULTATI IMPORT                      ║'));
    console.log(colors.cyan.bold('╚════════════════════════════════════════════════════════╝\n'));

    console.log(colors.white('Statistiche:'));
    console.log(colors.gray(`  File scansionati:       ${stats.scanned}`));
    console.log(colors.gray(`  Documenti trovati:      ${stats.total}`));
    console.log(colors.gray(`  Invalidi/Skippati:      ${stats.invalid}`));
    console.log(colors.gray(`  Già esistenti:          ${stats.alreadyExists}`));
    console.log(colors.green(`  ✅ Upload riusciti:     ${stats.success}`));
    console.log(colors.red(`  ❌ Upload falliti:      ${stats.failed}`));
    console.log(colors.gray(`  Durata:                 ${stats.duration}s`));
    console.log('');

    if (stats.errors.length > 0) {
      console.log(colors.red(`Errori (${stats.errors.length}):`));
      stats.errors.slice(0, 10).forEach(err => {
        console.log(colors.red(`  - ${err.file || err.batch}: ${err.error}`));
      });
      if (stats.errors.length > 10) {
        console.log(colors.red(`  ... e altri ${stats.errors.length - 10} errori (vedi log)`));
      }
      console.log('');
    }

    // Salva log
    await saveLog(stats);

    if (options.dryRun) {
      console.log(colors.yellow.bold('⚠️  DRY-RUN: Nessun file uploadato realmente\n'));
    } else {
      console.log(colors.green.bold('✅ Import completato!\n'));
    }

    process.exit(stats.failed > 0 ? 1 : 0);

  } catch (error) {
    if (progressStarted) {
      progressBar.stop();
    }

    console.error(colors.red.bold('\n❌ ERRORE FATALE:'), error.message);
    console.error(error.stack);

    stats.endTime = new Date().toISOString();
    stats.fatalError = error.message;
    await saveLog(stats);

    process.exit(1);
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

main().catch(error => {
  console.error(colors.red.bold('ERRORE:'), error);
  process.exit(1);
});
