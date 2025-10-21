#!/usr/bin/env node

/**
 * Script di Test per Import Documenti
 *
 * Testa il parsing e la validazione senza uploadare file reali
 */

const path = require('path');
const colors = require('colors');

// ============================================================================
// TEST UTILITIES
// ============================================================================

function parseFilename(filename) {
  const match = filename.match(/^(.+?)\.([a-z]{3,4})$/i);
  if (!match) return null;

  const [, nameWithoutExt, extension] = match;
  const numberMatch = nameWithoutExt.match(/^(.+?)\s+(\d+)$/);
  if (!numberMatch) return null;

  const [, supplier, docNumber] = numberMatch;

  return {
    supplier: supplier.trim(),
    docNumber: docNumber.trim(),
    extension: extension.toLowerCase(),
  };
}

function parseDate(folderName) {
  if (folderName.includes('%')) return null;

  const match = folderName.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;

  return date;
}

// ============================================================================
// TEST CASES
// ============================================================================

const TEST_CASES = [
  // Filename parsing
  {
    name: 'Filename valido standard',
    type: 'filename',
    input: 'ABC RICAMI 1894.pdf',
    expected: { supplier: 'ABC RICAMI', docNumber: '1894', extension: 'pdf' },
  },
  {
    name: 'Filename con spazi multipli',
    type: 'filename',
    input: 'ATELIER AMELIER 162.pdf',
    expected: { supplier: 'ATELIER AMELIER', docNumber: '162', extension: 'pdf' },
  },
  {
    name: 'Filename con numero lungo',
    type: 'filename',
    input: 'VALENTINO 9000028669.pdf',
    expected: { supplier: 'VALENTINO', docNumber: '9000028669', extension: 'pdf' },
  },
  {
    name: 'Filename con fornitore con apostrofo',
    type: 'filename',
    input: "TOD'S 2409.pdf",
    expected: { supplier: "TOD'S", docNumber: '2409', extension: 'pdf' },
  },
  {
    name: 'Filename JPG',
    type: 'filename',
    input: 'FORNITORE TEST 123.jpg',
    expected: { supplier: 'FORNITORE TEST', docNumber: '123', extension: 'jpg' },
  },
  {
    name: 'Filename invalido (senza numero)',
    type: 'filename',
    input: 'DOCUMENTO SENZA NUMERO.pdf',
    expected: null,
  },
  {
    name: 'Filename invalido (solo numero)',
    type: 'filename',
    input: '12345.pdf',
    expected: null,
  },

  // Date parsing
  {
    name: 'Data valida',
    type: 'date',
    input: '01-08-2023',
    expected: new Date('2023-08-01'),
  },
  {
    name: 'Data valida con zeri',
    type: 'date',
    input: '09-01-2023',
    expected: new Date('2023-01-09'),
  },
  {
    name: 'Data con pattern % (bug legacy)',
    type: 'date',
    input: '%d-%m-%Y',
    expected: null,
  },
  {
    name: 'Data invalida (formato errato)',
    type: 'date',
    input: '2023-08-01',
    expected: null,
  },
  {
    name: 'Data invalida (valori impossibili)',
    type: 'date',
    input: '32-13-2023',
    expected: null,
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

function runTests() {
  console.log(colors.cyan.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(colors.cyan.bold('║         CoreDocument - Test Import Functions          ║'));
  console.log(colors.cyan.bold('╚════════════════════════════════════════════════════════╝\n'));

  let passed = 0;
  let failed = 0;

  TEST_CASES.forEach((testCase, index) => {
    const testNum = `[${index + 1}/${TEST_CASES.length}]`;

    let result;
    if (testCase.type === 'filename') {
      result = parseFilename(testCase.input);
    } else if (testCase.type === 'date') {
      result = parseDate(testCase.input);
    }

    // Confronta risultato
    let success = false;
    if (result === null && testCase.expected === null) {
      success = true;
    } else if (result !== null && testCase.expected !== null) {
      if (testCase.type === 'filename') {
        success = (
          result.supplier === testCase.expected.supplier &&
          result.docNumber === testCase.expected.docNumber &&
          result.extension === testCase.expected.extension
        );
      } else if (testCase.type === 'date') {
        success = result.getTime() === testCase.expected.getTime();
      }
    }

    if (success) {
      console.log(colors.green(`${testNum} ✅ ${testCase.name}`));
      passed++;
    } else {
      console.log(colors.red(`${testNum} ❌ ${testCase.name}`));
      console.log(colors.gray(`     Input:    ${testCase.input}`));
      console.log(colors.gray(`     Expected: ${JSON.stringify(testCase.expected)}`));
      console.log(colors.gray(`     Got:      ${JSON.stringify(result)}`));
      failed++;
    }
  });

  console.log('');
  console.log(colors.cyan('━'.repeat(60)));
  console.log(colors.white(`Risultati: ${colors.green(passed + ' passed')}, ${failed > 0 ? colors.red(failed + ' failed') : colors.green('0 failed')}`));
  console.log(colors.cyan('━'.repeat(60)));
  console.log('');

  if (failed === 0) {
    console.log(colors.green.bold('✅ Tutti i test passati!\n'));
    process.exit(0);
  } else {
    console.log(colors.red.bold(`❌ ${failed} test falliti\n`));
    process.exit(1);
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

runTests();
