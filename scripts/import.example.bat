@echo off
REM Script di esempio per import documenti legacy
REM Copia questo file come import.bat e configura le variabili

REM ============================================================================
REM CONFIGURAZIONE
REM ============================================================================

REM Path alla cartella sorgente documenti
set SOURCE_PATH=Y:\

REM JWT Token (ottienilo facendo login su http://localhost:81)
REM Oppure via: curl -X POST http://localhost:81/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"password\"}"
set JWT_TOKEN=YOUR_JWT_TOKEN_HERE

REM API URL (default: http://localhost:81/api)
set API_URL=http://localhost:81/api

REM Batch size (numero di file per upload, default: 20)
set BATCH_SIZE=20

REM ============================================================================
REM NON MODIFICARE SOTTO QUESTA LINEA
REM ============================================================================

echo.
echo ========================================
echo   CoreDocument - Import Documenti
echo ========================================
echo.

REM Verifica che il token sia configurato
if "%JWT_TOKEN%"=="YOUR_JWT_TOKEN_HERE" (
    echo [ERRORE] JWT_TOKEN non configurato!
    echo.
    echo Istruzioni:
    echo 1. Fai login su http://localhost:81
    echo 2. Apri DevTools ^(F12^) -^> Console
    echo 3. Esegui: localStorage.getItem^('token'^)
    echo 4. Copia il token e incollalo in questo file
    echo.
    pause
    exit /b 1
)

REM Chiedi conferma
echo Configurazione:
echo   Source:     %SOURCE_PATH%
echo   API URL:    %API_URL%
echo   Batch size: %BATCH_SIZE%
echo.
echo ATTENZIONE: Verifica che CoreDocument sia attivo!
echo.
set /p CONFIRM=Vuoi procedere con l'import? (S/N):

if /i not "%CONFIRM%"=="S" (
    echo Import annullato.
    exit /b 0
)

echo.
echo Avvio import...
echo.

node import-legacy-documents.js ^
    --source "%SOURCE_PATH%" ^
    --api-url "%API_URL%" ^
    --token "%JWT_TOKEN%" ^
    --batch-size %BATCH_SIZE% ^
    --verbose

echo.
echo ========================================
echo.

if %ERRORLEVEL% EQU 0 (
    echo [OK] Import completato con successo!
) else (
    echo [ERRORE] Import fallito. Controlla import-log.json
)

echo.
pause
