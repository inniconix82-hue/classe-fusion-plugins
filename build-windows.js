const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// ─── 1. Build ─────────────────────────────────────────────────────
console.log('📦 Build du projet...')
execSync('npm run build', { stdio: 'inherit' })

// ─── 2. Temp directory ────────────────────────────────────────────
const tmpDir = path.join(__dirname, '.package-tmp')
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
fs.mkdirSync(tmpDir)

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath)
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
delete pkg.devDependencies; delete pkg.dependencies; delete pkg.build; delete pkg.scripts
fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))

copyDir(path.join(__dirname, 'dist'), path.join(tmpDir, 'dist'))
copyDir(path.join(__dirname, 'dist-electron'), path.join(tmpDir, 'dist-electron'))

// ─── 3. Package ───────────────────────────────────────────────────
const packager = require('@electron/packager')

async function run() {
  const arch = process.env.WIN_ARCH || 'x64'
  console.log(`🪟  Packaging pour Windows (${arch})...`)

  const iconIco = path.join(__dirname, 'public', 'icon.ico')

  const packagerOptions = {
    dir: tmpDir,
    name: 'Raccourcis Clavier',
    platform: 'win32',
    arch,
    out: path.join(__dirname, 'release'),
    overwrite: true,
    appVersion: '1.0.0',
    appBundleId: 'com.raccourcisclavier.app',
    win32metadata: {
      CompanyName: 'Raccourcis Clavier',
      FileDescription: 'Gestionnaire de raccourcis clavier multi-logiciels',
      ProductName: 'Raccourcis Clavier',
    },
  }
  if (fs.existsSync(iconIco)) packagerOptions.icon = iconIco

  const appPaths = await packager(packagerOptions)
  const appFolder = appPaths[0]
  console.log('✅ App packagée dans:', appFolder)

  // ─── 4. Ajoute install.bat + LISEZMOI.txt ─────────────────────
  const installBat = `@echo off
setlocal
set "APP_NAME=Raccourcis Clavier"
set "EXE_NAME=Raccourcis Clavier.exe"
set "SCRIPT_DIR=%~dp0"
set "APP_SRC=%SCRIPT_DIR%Raccourcis Clavier-win32-${arch}"
set "DEST=%LOCALAPPDATA%\\%APP_NAME%"

echo.
echo ==========================================
echo    Raccourcis Clavier ^— Installateur
echo ==========================================
echo.

if not exist "%APP_SRC%" (
  echo [ERREUR] Dossier de l'application introuvable.
  pause & exit /b 1
)

if exist "%DEST%" (
  set /p CONFIRM="Remplacer la version existante ? [O/N] : "
  if /i not "%CONFIRM%"=="O" ( echo Annule. & pause & exit /b 0 )
  rd /s /q "%DEST%"
)

echo Copie vers %DEST%...
xcopy /e /i /q "%APP_SRC%" "%DEST%"

echo Création du raccourci Bureau...
powershell -NoProfile -Command ^
  "$s=(New-Object -COM WScript.Shell).CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'),'Raccourcis Clavier.lnk'));$s.TargetPath='%DEST%\\%EXE_NAME%';$s.Save()"

echo.
echo [OK] Installation reussie !
set /p LAUNCH="Lancer maintenant ? [O/N] : "
if /i "%LAUNCH%"=="O" start "" "%DEST%\\%EXE_NAME%"
pause
`

  const lisezmoi = `RACCOURCIS CLAVIER v1.0
==========================================

INSTALLATION
  Double-cliquez sur install.bat
  Ou copiez manuellement le dossier ou vous voulez et lancez l'exe.

OVERLAY GLOBAL
  Ctrl + Shift + K  -->  affiche/masque l'overlay depuis n'importe quelle app
  L'overlay s'ouvre sur la recherche et detecte DaVinci, Photoshop, VS Code...

CHANGER LE RACCOURCI
  Cliquez engrenage dans l'overlay --> saisissez la nouvelle combinaison --> Sauver

IMPORT
  Supporte : DaVinci Resolve .keyb · VS Code keybindings.json
             Photoshop .kys · CSV generique

DESINSTALLATION
  Supprimez le dossier d'installation et le raccourci Bureau.
`

  fs.writeFileSync(path.join(appFolder, 'install.bat'), installBat)
  fs.writeFileSync(path.join(appFolder, 'LISEZMOI.txt'), lisezmoi)

  // ─── 5. ZIP ───────────────────────────────────────────────────────
  const zipName = `Raccourcis-Clavier-Windows-${arch}.zip`
  const zipPath = path.join(__dirname, 'release', zipName)
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  console.log('🗜️  Création du ZIP...')
  const releaseDir = path.join(__dirname, 'release')
  const folderName = path.basename(appFolder)

  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${appFolder}' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    )
  } else {
    execSync(`cd "${releaseDir}" && zip -r -y "${zipPath}" "${folderName}"`, { stdio: 'inherit' })
  }

  if (!fs.existsSync(zipPath)) throw new Error('ZIP non créé.')

  const sizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)
  console.log(`\n🎉  ${zipName} (${sizeMb} Mo)`)
  console.log(`    Contenu : Raccourcis Clavier-win32-${arch}/ + install.bat + LISEZMOI.txt`)
  console.log(`    → Dézippe et lance install.bat`)

  fs.rmSync(tmpDir, { recursive: true })
}

run().catch(err => {
  console.error('❌ Build échoué:', err)
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  process.exit(1)
})
