const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// 1. Build the app
console.log('📦 Build du projet...')
execSync('npm run build', { stdio: 'inherit' })

// 2. Create a clean temp directory for packaging
const tmpDir = path.join(__dirname, '.package-tmp')
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
fs.mkdirSync(tmpDir)

// 3. Copy only needed files
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
// All frontend code is bundled by Vite — no npm deps needed at runtime
delete pkg.devDependencies
delete pkg.dependencies
delete pkg.build
delete pkg.scripts
fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))

copyDir(path.join(__dirname, 'dist'), path.join(tmpDir, 'dist'))
copyDir(path.join(__dirname, 'dist-electron'), path.join(tmpDir, 'dist-electron'))

// 4. Package with electron packager
const packager = require('@electron/packager')
async function run() {
  // Build for both Intel and Apple Silicon
  const arch = process.env.MAC_ARCH || 'universal'
  console.log(`🍎 Packaging pour macOS (${arch})...`)

  const icnsPath = path.join(__dirname, 'public', 'icon.icns')
  const packagerOptions = {
    dir: tmpDir,
    name: 'Node Organisation',
    platform: 'darwin',
    arch,
    out: path.join(__dirname, 'release'),
    overwrite: true,
    appVersion: '1.0.0',
    appBundleId: 'com.nodeorganisation.app',
  }
  if (fs.existsSync(icnsPath)) packagerOptions.icon = icnsPath

  const appPaths = await packager(packagerOptions)

  const appFolder = appPaths[0]
  console.log('✅ App packagée dans:', appFolder)

  // 5. Create ZIP
  const zipName = `Node-Organisation-Mac-${arch}.zip`
  const zipPath = path.join(__dirname, 'release', zipName)
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  console.log('🗜️  Création du ZIP...')
  const releaseDir = path.join(__dirname, 'release')
  const folderName = path.basename(appFolder)
  try {
    execSync(
      `ditto -c -k --sequesterRsrc --keepParent "${appFolder}" "${zipPath}"`,
      { stdio: 'inherit' }
    )
  } catch {
    console.log('⚠️  ditto a échoué, essai avec zip -y...')
    execSync(
      `cd "${releaseDir}" && zip -r -y "${zipPath}" "${folderName}"`,
      { stdio: 'inherit' }
    )
  }

  if (!fs.existsSync(zipPath)) throw new Error('ZIP non créé — vérifiez les permissions du dossier release/')

  console.log(`\n🎉 ZIP créé : release/${zipName}`)
  console.log('   L\'utilisateur dézippe et glisse "Node Organisation.app" dans Applications.')
  console.log('   Ollama : https://ollama.com/download (installer séparément sur Mac)')

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true })
}

run().catch((err) => {
  console.error('❌ Build échoué:', err)
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  process.exit(1)
})
