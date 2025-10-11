@echo off
echo ============================================
echo Starting CoreDocument
echo ============================================
echo.
docker-compose -p coredocument up -d
echo.
echo ============================================
echo CoreDocument started!
echo ============================================
echo.
echo Application available at:
echo   - Frontend:    http://localhost:81
echo   - Backend API: http://localhost:81/api
echo.
docker-compose -p coredocument ps
