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
  const arches = ['x64', 'arm64']
  const icnsPath = path.join(__dirname, 'public', 'icon.icns')
  const releaseDir = path.join(__dirname, 'release')
  fs.mkdirSync(releaseDir, { recursive: true })

  for (const arch of arches) {
    console.log(`🍎 Packaging pour macOS (${arch})...`)

    const packagerOptions = {
      dir: tmpDir,
      name: 'Node Organisation',
      platform: 'darwin',
      arch,
      out: releaseDir,
      overwrite: true,
      appVersion: '1.0.0',
      appBundleId: 'com.nodeorganisation.app',
    }
    if (fs.existsSync(icnsPath)) packagerOptions.icon = icnsPath

    const appPaths = await packager(packagerOptions)
    const appFolder = appPaths && appPaths[0]
    if (!appFolder) {
      console.log(`⚠️  Pas de sortie pour ${arch}, skip ZIP`)
      continue
    }
    console.log('✅ App packagée dans:', appFolder)

    const zipName = `Node-Organisation-Mac-${arch}.zip`
    const zipPath = path.join(releaseDir, zipName)
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

    console.log('🗜️  Création du ZIP...')
    const folderName = path.basename(appFolder)
    try {
      execSync(
        `ditto -c -k --sequesterRsrc --keepParent "${appFolder}" "${zipPath}"`,
        { stdio: 'inherit' }
      )
    } catch {
      try {
        execSync(
          `cd "${releaseDir}" && zip -r -y "${zipName}" "${folderName}"`,
          { stdio: 'inherit' }
        )
      } catch {
        console.log(`⚠️  ZIP échoué pour ${arch}, le dossier .app reste disponible`)
      }
    }

    if (fs.existsSync(zipPath)) {
      console.log(`🎉 ZIP créé : release/${zipName}`)
    }
  }

  console.log('\n✅ Build terminé !')
  console.log('   Glisser "Node Organisation.app" dans Applications.')
  console.log('   Ollama : https://ollama.com/download (installer séparément sur Mac)')

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true })
}

run().catch((err) => {
  console.error('❌ Build échoué:', err)
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  process.exit(1)
})
