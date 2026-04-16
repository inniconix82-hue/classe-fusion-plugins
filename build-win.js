const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// 1. Build the app
console.log('Building app...')
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

// Copy package.json (strip devDependencies)
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
delete pkg.devDependencies
delete pkg.build
delete pkg.scripts
fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))

// Copy dist and dist-electron
copyDir(path.join(__dirname, 'dist'), path.join(tmpDir, 'dist'))
copyDir(path.join(__dirname, 'dist-electron'), path.join(tmpDir, 'dist-electron'))

// 4. Install production dependencies only
console.log('Installing production dependencies...')
execSync('npm install --omit=dev', { cwd: tmpDir, stdio: 'inherit' })

// 5. Package with electron
const packager = require('@electron/packager')
async function run() {
  console.log('Packaging for Windows...')
  const appPaths = await packager({
    dir: tmpDir,
    name: 'Node Organisation',
    platform: 'win32',
    arch: 'x64',
    out: path.join(__dirname, 'release'),
    overwrite: true,
    appVersion: '1.0.0',
    electronVersion: undefined, // auto-detect
  })
  console.log('Done! App packaged at:', appPaths[0])

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true })
}

run().catch((err) => {
  console.error('Build failed:', err)
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  process.exit(1)
})
