const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// 1. Build the app
console.log('📦 Build du projet...')
execSync('npm run build', { stdio: 'inherit' })

// 2. Create release dir
const releaseDir = path.join(__dirname, 'release')
if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir)

// 3. Try native macOS packaging with electron-packager
const packager = require('@electron/packager')
async function run() {
  const arch = process.env.MAC_ARCH || 'universal'
  console.log(`🍎 Packaging pour macOS (${arch})...`)

  const tmpDir = path.join(__dirname, '.package-tmp')
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  fs.mkdirSync(tmpDir)

  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)
      if (entry.isDirectory()) copyDir(srcPath, destPath)
      else fs.copyFileSync(srcPath, destPath)
    }
  }

  // Strip dev deps for the packaged app (electron handles runtime)
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
  delete pkg.devDependencies
  delete pkg.build
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))
  copyDir(path.join(__dirname, 'dist'), path.join(tmpDir, 'dist'))
  copyDir(path.join(__dirname, 'dist-electron'), path.join(tmpDir, 'dist-electron'))

  const icnsPath = path.join(__dirname, 'public', 'icon.icns')
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
  fs.rmSync(tmpDir, { recursive: true })

  const appFolder = appPaths && appPaths[0]

  if (!appFolder) {
    // Cross-compilation not supported on Linux → source ZIP
    buildSourceZip()
    return
  }

  console.log('✅ App packagée dans:', appFolder)
  const zipName = `Node-Organisation-Mac-${arch}.zip`
  const zipPath = path.join(releaseDir, zipName)
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  console.log('🗜️  Création du ZIP...')
  try {
    execSync(`ditto -c -k --sequesterRsrc --keepParent "${appFolder}" "${zipPath}"`, { stdio: 'inherit' })
  } catch {
    console.log('⚠️  ditto indisponible, essai avec zip...')
    execSync(`cd "${releaseDir}" && zip -r -y "${zipPath}" "${path.basename(appFolder)}"`, { stdio: 'inherit' })
  }

  console.log(`\n🎉 ZIP : release/${zipName}`)
  console.log('   Dézipper → glisser "Node Organisation.app" dans Applications.')
}

function copyDirSimple(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.name === 'node_modules') continue
    if (entry.isDirectory()) copyDirSimple(s, d)
    else fs.copyFileSync(s, d)
  }
}

function buildSourceZip() {
  console.log('⚠️  Packaging macOS natif impossible sur Linux — ZIP source complet...')

  const zipName = 'Node-Organisation-Mac-source.zip'
  const zipPath = path.join(releaseDir, zipName)
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  // Include everything needed to run on Mac after npm install
  const include = [
    'src',
    'public',
    'dist',
    'dist-electron',
    'electron',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'vite.electron.config.ts',
    'vite.preload.config.ts',
    'index.html',
    'main.js',
    'preload.js',
  ].filter((f) => fs.existsSync(path.join(__dirname, f)))

  // Create a temp folder with the right name so the ZIP has a proper parent folder
  const srcDir = path.join(releaseDir, 'Node-Organisation')
  if (fs.existsSync(srcDir)) fs.rmSync(srcDir, { recursive: true })
  fs.mkdirSync(srcDir)
  include.forEach((f) => {
    const src = path.join(__dirname, f)
    const dest = path.join(srcDir, f)
    if (fs.statSync(src).isDirectory()) {
      copyDirSimple(src, dest)
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
    }
  })
  execSync(
    `zip -r "${zipPath}" "Node-Organisation" -x "*.DS_Store" -x "*/node_modules/*"`,
    { stdio: 'inherit', cwd: releaseDir }
  )
  fs.rmSync(srcDir, { recursive: true })

  console.log(`\n✅ ZIP source : release/${zipName}`)
  console.log('\n   Sur Mac, dans le dossier dézippé :')
  console.log('   1. npm install')
  console.log('   2. npm run electron:dev')
}

run().catch((err) => {
  console.error('❌ Build échoué:', err)
  process.exit(1)
})
