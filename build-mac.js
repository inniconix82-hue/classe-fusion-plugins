const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// ─── 1. Build ─────────────────────────────────────────────────────
console.log('📦 Build du projet...')
execSync('npm run build', { stdio: 'inherit' })

// ─── 2. Generate .icns from icon.png (macOS only, uses sips + iconutil) ──
const iconPng  = path.join(__dirname, 'public', 'icon.png')
const icnsPath = path.join(__dirname, 'public', 'icon.icns')
const iconset  = path.join(__dirname, 'public', 'AppIcon.iconset')

if (process.platform === 'darwin' && fs.existsSync(iconPng)) {
  console.log('🎨 Génération de icon.icns...')
  try {
    if (fs.existsSync(iconset)) fs.rmSync(iconset, { recursive: true })
    fs.mkdirSync(iconset)
    const sizes = [
      ['icon_16x16.png', 16], ['icon_16x16@2x.png', 32],
      ['icon_32x32.png', 32], ['icon_32x32@2x.png', 64],
      ['icon_128x128.png', 128], ['icon_128x128@2x.png', 256],
      ['icon_256x256.png', 256], ['icon_256x256@2x.png', 512],
      ['icon_512x512.png', 512], ['icon_512x512@2x.png', 1024],
    ]
    for (const [name, sz] of sizes) {
      execSync(`sips -z ${sz} ${sz} "${iconPng}" --out "${path.join(iconset, name)}"`, { stdio: 'pipe' })
    }
    execSync(`iconutil -c icns "${iconset}" --out "${icnsPath}"`, { stdio: 'inherit' })
    fs.rmSync(iconset, { recursive: true })
    console.log('✅ icon.icns généré')
  } catch (e) {
    console.warn('⚠️  icns non généré (sips/iconutil) — on continue sans')
  }
}

// ─── 3. Temp directory ────────────────────────────────────────────
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

// ─── 4. Package ───────────────────────────────────────────────────
const packager = require('@electron/packager')

async function run() {
  const arch = process.env.MAC_ARCH || 'universal'
  console.log(`🍎 Packaging pour macOS (${arch})...`)

  const packagerOptions = {
    dir: tmpDir,
    name: 'Raccourcis Clavier',
    platform: 'darwin',
    arch,
    out: path.join(__dirname, 'release'),
    overwrite: true,
    appVersion: '1.0.0',
    appBundleId: 'com.raccourcisclavier.app',
  }
  if (fs.existsSync(icnsPath)) packagerOptions.icon = icnsPath

  const appPaths = await packager(packagerOptions)
  const appFolder = appPaths[0]
  console.log('✅ App packagée dans:', appFolder)

  // ─── 5. Ajoute install.sh + LISEZMOI.txt dans le dossier release ──
  const installSh = `#!/bin/bash
APP_NAME="Raccourcis Clavier"
APP_FILE="\${APP_NAME}.app"
SCRIPT_DIR="\$(cd "\$(dirname "\$0")" && pwd)"
APP_SRC="\${SCRIPT_DIR}/\${APP_FILE}"
DEST="/Applications/\${APP_FILE}"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Raccourcis Clavier — Installateur   ║"
echo "╚════════════════════════════════════════╝"
echo ""

if [[ "$(uname)" != "Darwin" ]]; then echo "❌  macOS requis."; exit 1; fi
if [[ ! -d "\${APP_SRC}" ]]; then echo "❌  \${APP_FILE} introuvable."; exit 1; fi

if [[ -d "\${DEST}" ]]; then
  read -p "⚡  Remplacer la version existante ? [o/N] : " C
  [[ ! "\$C" =~ ^[oO]\$ ]] && echo "Annulé." && exit 0
  rm -rf "\${DEST}"
fi

echo "📋  Copie vers /Applications..."
cp -R "\${APP_SRC}" "\${DEST}" || sudo cp -R "\${APP_SRC}" "\${DEST}"

echo "🔓  Suppression de la quarantaine..."
xattr -dr com.apple.quarantine "\${DEST}" 2>/dev/null || true

if [[ -d "\${DEST}" ]]; then
  echo "\\n✅  Installation réussie !"
  echo "🎹  Raccourci global : Cmd+Shift+K"
  read -p "\\nLancer maintenant ? [O/n] : " L
  [[ ! "\$L" =~ ^[nN]\$ ]] && open "\${DEST}"
else
  echo "❌  Échec. Vérifiez /Applications."; exit 1
fi
`
  const lisezmoi = `RACCOURCIS CLAVIER v1.0
══════════════════════════════════════════

INSTALLATION
  Double-cliquez sur install.sh  (ou glissez l'app dans /Applications)
  → Première ouverture : clic droit → Ouvrir → Ouvrir (Gatekeeper)

OVERLAY GLOBAL
  Cmd + Shift + K  →  affiche/masque l'overlay depuis n'importe quelle app
  L'overlay s'ouvre sur la recherche et détecte DaVinci, Photoshop, VS Code…

CHANGER LE RACCOURCI
  Cliquez ⚙️ dans l'overlay → saisissez la nouvelle combinaison → Sauver

IMPORT
  Supporte : DaVinci Resolve .keyb · VS Code keybindings.json
             Photoshop .kys · CSV générique

DÉSINSTALLATION
  Supprimez /Applications/Raccourcis Clavier.app
`
  const installPath = path.join(appFolder, 'install.sh')
  const lisezmoiPath = path.join(appFolder, 'LISEZMOI.txt')
  fs.writeFileSync(installPath, installSh, { mode: 0o755 })
  fs.writeFileSync(lisezmoiPath, lisezmoi)

  // ─── 6. ZIP ───────────────────────────────────────────────────────
  const zipName = `Raccourcis-Clavier-Mac-${arch}.zip`
  const zipPath = path.join(__dirname, 'release', zipName)
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  console.log('🗜️  Création du ZIP...')
  const releaseDir = path.join(__dirname, 'release')
  const folderName = path.basename(appFolder)
  try {
    execSync(`ditto -c -k --sequesterRsrc --keepParent "${appFolder}" "${zipPath}"`, { stdio: 'inherit' })
  } catch {
    console.log('⚠️  ditto indisponible, utilisation de zip...')
    execSync(`cd "${releaseDir}" && zip -r -y "${zipPath}" "${folderName}"`, { stdio: 'inherit' })
  }

  if (!fs.existsSync(zipPath)) throw new Error('ZIP non créé.')

  const sizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)
  console.log(`\n🎉  ${zipName} (${sizeMb} Mo)`)
  console.log(`    Contenu : Raccourcis Clavier.app + install.sh + LISEZMOI.txt`)
  console.log(`    → Dézippe et lance install.sh`)

  fs.rmSync(tmpDir, { recursive: true })
}

run().catch(err => {
  console.error('❌ Build échoué:', err)
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  process.exit(1)
})
