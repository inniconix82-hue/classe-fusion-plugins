@echo off
echo ============================================
echo   Node Organisation - Build Windows .EXE
echo ============================================
echo.

REM Desactiver la signature de code (pas necessaire pour usage personnel)
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo [1/3] Installation des dependances...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: npm install a echoue. Verifie que Node.js est installe.
    pause
    exit /b 1
)

echo.
echo [2/3] Compilation du projet...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: La compilation a echoue.
    pause
    exit /b 1
)

echo.
echo [3/3] Creation de l'installeur Windows...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo ERREUR: electron-builder a echoue.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD TERMINE !
echo   L'installeur se trouve dans : release\
echo ============================================
echo.
explorer release
pause
