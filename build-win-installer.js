// Set env BEFORE requiring electron-builder
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
process.env.WIN_CSC_LINK = ''
process.env.WIN_CSC_KEY_PASSWORD = ''

const { execSync } = require('child_process')

console.log('📦 Build en cours...')
execSync('npm run build', { stdio: 'inherit' })

console.log('🪟 Packaging Windows installer...')
execSync('npx electron-builder --win', {
  stdio: 'inherit',
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
    WIN_CSC_LINK: '',
    WIN_CSC_KEY_PASSWORD: '',
  },
})

console.log('✅ Installateur généré dans release/')
