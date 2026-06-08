import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { FloatingOverlay } from './components/shortcuts/FloatingOverlay'
import './styles/global.css'

const isOverlay = window.location.hash === '#overlay'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isOverlay ? <FloatingOverlay /> : <App />}
  </React.StrictMode>,
)
