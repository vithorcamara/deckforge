import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.css'
import PWABadge from './components/PWABadge/index.jsx'
import App from './pages/App/index.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <PWABadge />
  </StrictMode>,
)
