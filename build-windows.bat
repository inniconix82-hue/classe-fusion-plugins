@echo off
echo ============================================
echo   Node Organisation - Build Windows .EXE
echo ============================================
echo.

echo [1/4] Installation des dependances...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: npm install a echoue. Verifie que Node.js est installe.
    pause
    exit /b 1
)

echo.
echo [2/4] Installation de electron/packager...
call npm install --save-dev @electron/packager
if %errorlevel% neq 0 (
    echo ERREUR: Installation du packager a echoue.
    pause
    exit /b 1
)

echo.
echo [3/4] Compilation du projet...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: La compilation a echoue.
    pause
    exit /b 1
)

echo.
echo [4/4] Creation du .EXE Windows...
call npx @electron/packager . "Node Organisation" --platform=win32 --arch=x64 --out=release --overwrite --ignore="node_modules/((?!(@dagrejs|@xyflow|react|react-dom|scheduler|css-mediaquery)).)" --ignore="src|public|electron|\.ts$|\.bat$|\.md$|vite\.config|tsconfig|vite\.web" --app-version=1.0.0
if %errorlevel% neq 0 (
    echo ERREUR: Le packaging a echoue.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD TERMINE !
echo   L'application se trouve dans :
echo   release\Node Organisation-win32-x64\
echo.
echo   Lance : Node Organisation.exe
echo ============================================
echo.
explorer "release\Node Organisation-win32-x64"
pause
