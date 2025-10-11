@echo off
echo ============================================
echo Building CoreDocument
echo ============================================
docker-compose -p coredocument build %*
echo.
echo Build completed!
