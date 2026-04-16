const { execSync } = require('child_process')
const https = require('https')
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
delete pkg.devDependencies
delete pkg.build
delete pkg.scripts
fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))

copyDir(path.join(__dirname, 'dist'), path.join(tmpDir, 'dist'))
copyDir(path.join(__dirname, 'dist-electron'), path.join(tmpDir, 'dist-electron'))

// 4. Install production dependencies only
console.log('📥 Installation des dépendances de production...')
execSync('npm install --omit=dev', { cwd: tmpDir, stdio: 'inherit' })

// Download file helper
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        const total = parseInt(res.headers['content-length'] || '0', 10)
        let downloaded = 0
        const file = fs.createWriteStream(dest)
        res.on('data', (chunk) => {
          downloaded += chunk.length
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100)
            process.stdout.write(`\r   Téléchargement: ${pct}% (${Math.round(downloaded/1024/1024)}MB / ${Math.round(total/1024/1024)}MB)`)
          }
        })
        res.pipe(file)
        file.on('finish', () => { file.close(); console.log(''); resolve() })
        file.on('error', reject)
      }).on('error', reject)
    }
    follow(url)
  })
}

// 5. Package with electron packager
const packager = require('@electron/packager')
async function run() {
  console.log('🪟 Packaging pour Windows...')
  const appPaths = await packager({
    dir: tmpDir,
    name: 'Node Organisation',
    platform: 'win32',
    arch: 'x64',
    out: path.join(__dirname, 'release'),
    overwrite: true,
    appVersion: '1.0.0',
  })

  const appFolder = appPaths[0]
  console.log('✅ App packagée dans:', appFolder)

  // 6. Download OllamaSetup.exe
  const ollamaSetupPath = path.join(appFolder, 'OllamaSetup.exe')
  console.log('🤖 Téléchargement de OllamaSetup.exe...')
  try {
    await downloadFile('https://ollama.com/download/OllamaSetup.exe', ollamaSetupPath)
    console.log('✅ OllamaSetup.exe inclus dans le package')
  } catch (err) {
    console.log('⚠️  Impossible de télécharger OllamaSetup.exe:', err.message)
    console.log('   Vous pouvez le télécharger manuellement depuis https://ollama.com/download')
  }

  // 7. Create ZIP
  const zipName = 'Node-Organisation-Windows.zip'
  const zipPath = path.join(__dirname, 'release', zipName)
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  console.log('🗜️  Création du ZIP...')
  const isWin = process.platform === 'win32'
  if (isWin) {
    execSync(
      `powershell -Command "Compress-Archive -Path '${appFolder}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    )
  } else {
    execSync(`cd "${appFolder}" && zip -r "${zipPath}" .`, { stdio: 'inherit' })
  }

  console.log(`\n🎉 ZIP créé : release/${zipName}`)
  console.log('   Contient : Node Organisation.exe + OllamaSetup.exe')
  console.log('   L\'utilisateur dézippe, installe Ollama, puis lance l\'app.')

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true })
}

run().catch((err) => {
  console.error('❌ Build échoué:', err)
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  process.exit(1)
})
